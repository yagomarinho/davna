/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Collection, Document, MongoClient, MongoClientOptions } from 'mongodb'

import {
  DraftEntity,
  Entity,
  EntityContext,
  isEntity,
  QueryBuilder,
  Repository,
  RepositoryResult,
} from '@davna/core'

import { MongoClientConfig, MongoWithURIConfig } from './mongo.client.config'
import { CONNECTION_STATUS } from './connection.status'
import { fromDocument, isConnected, mongoId, toDocument } from './helpers'
import { applySorts, whereAdaptToFindQuery } from './query'

/**
 * Resource identifier for MongoDB repositories.
 *
 * Used to discriminate MongoDB repository implementations
 * from other repository types at runtime.
 */

export const MongoRepositoryURI = 'mongo.repo'
export type MongoRepositoryURI = typeof MongoRepositoryURI

/**
 * MongoRepository interface.
 *
 * Represents a repository that manages entities in a MongoDB collection,
 * providing full CRUD and batch operations, as well as connection
 * lifecycle management.
 *
 * - E: the entity type stored in the repository
 */

export interface MongoRepository<E extends Entity> extends Repository<
  E,
  MongoRepositoryURI
> {
  /**
   * Infrastructure methods for managing the underlying MongoDB connection.
   *
   * Includes utilities to create clients, connect, disconnect, and clear
   * collections.
   */

  readonly infra: Readonly<{
    /** Create a new MongoClient instance from a URI */
    createClient: (
      uri: string,
      options?: MongoClientOptions,
    ) => RepositoryResult<MongoClient>

    /** Connects to the MongoDB collection */
    connect: () => RepositoryResult<void>

    /** Disconnects from the MongoDB collection */
    disconnect: () => RepositoryResult<void>

    /** Clears (drops) the collection */
    clear: () => RepositoryResult<void>
  }>
}

/**
 * Factory function for creating a MongoDB-backed repository.
 *
 * Supports two configuration modes:
 * - MongoClientConfig: uses a pre-existing MongoClient
 * - MongoWithURIConfig: creates a MongoClient from a URI
 *
 * Returns a repository with standard CRUD methods (`get`, `set`, `remove`,
 * `query`, `batch`) and `infra` methods for connection management.
 *
 * - E: the entity type managed by the repository
 */

export function MongoRepository<E extends Entity>(
  config: MongoClientConfig<E>,
): MongoRepository<E>
export function MongoRepository<E extends Entity>(
  config: MongoWithURIConfig<E>,
): MongoRepository<E>
export function MongoRepository<E extends Entity>({
  database,
  collection,
  converter,
  projection,
  tag,
  entityContext = mongoEntityContext(),
  ...rest
}: MongoClientConfig<E> | MongoWithURIConfig<E>): MongoRepository<E> {
  const client: MongoClient =
    (rest as any).client ?? new MongoClient((rest as any).uri)
  let coll: Collection<Document>
  let status = CONNECTION_STATUS.READY

  const connect: MongoRepository<E>['infra']['connect'] = async () => {
    if (status !== CONNECTION_STATUS.READY)
      throw new Error('Connection has been initialized')

    if (await isConnected(client)) {
      status = CONNECTION_STATUS.CONNECTED
      coll = client.db(database).collection(collection)

      return
    }

    const connection = await client.connect()

    coll = connection.db(database).collection(collection)
    status = CONNECTION_STATUS.CONNECTED
  }

  const disconnect = verifyConnectionProxy<
    MongoRepository<E>['infra']['disconnect']
  >(async () => {
    await client.close()
    status = CONNECTION_STATUS.DISCONNECTED
  })

  const get = verifyConnectionProxy<Repository<E>['methods']['get']>(
    async id => {
      try {
        const item = await coll.findOne({ _id: mongoId(id) }, { projection })

        if (item === null) return

        return converter.from(fromDocument(item))
      } catch {
        return
      }
    },
  )

  const set = verifyConnectionProxy<Repository<E>['methods']['set']>(
    async entity => {
      const e = await entityContext.declareEntity(entity)

      const { _id, ...props } = toDocument(converter.to(e))

      const result = await coll.updateOne(
        { _id },
        { $set: props },
        { upsert: true },
      )

      const doc = await coll.findOne(
        { _id: result.upsertedId ? result.upsertedId! : _id },
        { projection },
      )

      if (!doc) throw new Error('Internal MongoDB Error')

      return converter.from(fromDocument(doc))
    },
  )

  const remove = verifyConnectionProxy<Repository<E>['methods']['remove']>(
    async id => {
      await coll.deleteOne({ _id: mongoId(id) })
    },
  )

  const query = verifyConnectionProxy<Repository<E>['methods']['query']>(
    async (q = QueryBuilder<E>().build()) => {
      let find = coll.find(
        q.filter_by && q.filter_by.value
          ? whereAdaptToFindQuery(q.filter_by)
          : {},
      )

      if (typeof q.batch_size === 'number' && q.batch_size !== Infinity) {
        const skip = q.cursor_ref ? parseInt(q.cursor_ref) * q.batch_size : 0
        find = find.limit(q.batch_size).skip(skip)
      }

      if (q.order_by && q.order_by.length) {
        find = find.sort(applySorts(q.order_by))
      }

      if (projection) find.project(projection)

      return (await find.toArray()).map(doc =>
        converter.from(fromDocument(doc)),
      )
    },
  )

  const batch = verifyConnectionProxy<Repository<E>['methods']['batch']>(
    async b => {
      const bulk = await Promise.all(
        b.map(async item => {
          if (item.type === 'remove')
            return {
              deleteOne: {
                filter: { _id: mongoId(item.data) },
              },
            }

          const e = await entityContext.declareEntity(item.data)

          const { _id, ...props } = toDocument(converter.to(e))

          return {
            updateOne: {
              filter: { _id },
              update: { $set: props },
              upsert: true,
            },
          }
        }),
      )

      const result = await coll.bulkWrite(bulk, { ordered: false })

      return {
        status: result.isOk() ? 'successful' : 'failed',
        time: new Date(),
      }
    },
  )

  const clear = verifyConnectionProxy<MongoRepository<E>['infra']['clear']>(
    async () => {
      await coll.drop()
    },
  )

  const createClient = (uri: string, options?: MongoClientOptions) =>
    new MongoClient(uri, options)

  function verifyConnectionProxy<F extends (...args: any[]) => any>(
    fn: F,
  ): (...args: Parameters<F>) => ReturnType<F> {
    return (...args) => {
      if (status !== CONNECTION_STATUS.CONNECTED)
        throw new Error('connection not established')

      return fn(...args)
    }
  }

  return {
    _t: tag,
    meta: {
      _r: 'repository',
      _t: MongoRepositoryURI,
    },
    methods: {
      get,
      set,
      remove,
      query,
      batch,
    },
    infra: {
      createClient,
      connect,
      disconnect,
      clear,
    },
  }
}

function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id)
}

function mongoEntityContext(): EntityContext {
  const validateEntity: EntityContext['validateEntity'] = <E extends Entity>(
    entity: DraftEntity<E>,
  ): entity is E => isEntity(entity) && isValidObjectId(entity.meta.id)

  const createMeta: EntityContext['createMeta'] = () => ({
    id: '',
    _r: 'entity',
    created_at: new Date(),
    updated_at: new Date(),
  })

  const declareEntity: EntityContext['declareEntity'] = async <
    E extends Entity,
  >(
    entity: DraftEntity<E>,
  ): Promise<E> =>
    validateEntity(entity)
      ? entity
      : (entity._b(entity.props, await createMeta()) as any)

  return {
    declareEntity,
    validateEntity,
    createMeta,
  }
}
