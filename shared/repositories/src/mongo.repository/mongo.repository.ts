/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Collection, Document, MongoClient, MongoClientOptions } from 'mongodb'

import { Entity, QueryBuilder, Repository, RepositoryResult } from '@davna/core'

import { MongoClientConfig, MongoWithURIConfig } from './mongo.client.config'
import { CONNECTION_STATUS } from './connection.status'
import { fromDocument, isConnected, mongoId, toDocument } from './helpers'
import { applySorts, whereAdaptToFindQuery } from './query'

export const MongoRepositoryURI = 'mongo.repo'
export type MongoRepositoryURI = typeof MongoRepositoryURI

export interface MongoRepository<E extends Entity> extends Repository<
  E,
  MongoRepositoryURI
> {
  readonly infra: Readonly<{
    createClient: (
      uri: string,
      options?: MongoClientOptions,
    ) => RepositoryResult<MongoClient>
    connect: () => RepositoryResult<void>
    disconnect: () => RepositoryResult<void>
    clear: () => RepositoryResult<void>
  }>
}

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
      const item = await coll.findOne({ _id: mongoId(id) }, { projection })

      if (item === null) return

      return converter.from(fromDocument(item))
    },
  )

  const set = verifyConnectionProxy<Repository<E>['methods']['set']>(
    async entity => {
      const { _id, ...props } = toDocument(converter.to(entity))

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
        q.filter_by ? whereAdaptToFindQuery(q.filter_by) : {},
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
      const bulk = b.map(item => {
        if (item.type === 'remove')
          return {
            deleteOne: {
              filter: { _id: mongoId(item.data) },
            },
          }

        const { _id, ...props } = toDocument(converter.to(item.data))

        return {
          updateOne: {
            filter: { _id },
            update: { $set: props },
            upsert: true,
          },
        }
      })

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
