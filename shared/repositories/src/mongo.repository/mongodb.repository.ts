/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Collection, MongoClient, ObjectId } from 'mongodb'

import {
  Entity,
  QueryBuilder,
  Repository,
  RepositoryResult,
  Sort,
  Where,
  WhereComposite,
  WhereLeaf,
} from '@davna/core'
import { MongoClientConfig, MongoWithURIConfig } from './mongo.client.config'
import { CONNECTION_STATUS } from './connection.status'

export const MongoDBRepositoryURI = 'mongodb.repo'
export type MongoDBRepositoryURI = typeof MongoDBRepositoryURI

export interface MongoDBRepository<E extends Entity> extends Repository<
  E,
  MongoDBRepositoryURI
> {
  readonly infra: Readonly<{
    createClient: () => RepositoryResult<MongoClient>
    connect: () => RepositoryResult<void>
    disconnect: () => RepositoryResult<void>
    clear: () => RepositoryResult<void>
  }>
}

export function MongoDBRepository<E extends Entity>(
  config: MongoClientConfig<E>,
): MongoDBRepository<E>
export function MongoDBRepository<E extends Entity>(
  config: MongoWithURIConfig<E>,
): MongoDBRepository<E>
export function MongoDBRepository<E extends Entity>({
  database,
  collection,
  converter,
  projection,
  tag,
  ...rest
}: MongoClientConfig<E> | MongoWithURIConfig<E>): MongoDBRepository<E> {
  const client: MongoClient =
    (rest as any).client ?? new MongoClient((rest as any).uri)
  let coll: Collection<Document>
  let status = CONNECTION_STATUS.READY

  const connect: MongoDBRepository<E>['infra']['connect'] = async () => {
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
    MongoDBRepository<E>['infra']['disconnect']
  >(async () => {
    await client.close()
    status = CONNECTION_STATUS.DISCONNECTED
  })

  const get = verifyConnectionProxy<Repository<E>['methods']['get']>(
    async id => {
      const item = await coll.findOne({ _id: new ObjectId(id) }, { projection })

      if (item === null) return

      return converter.from(item)
    },
  )

  const set = verifyConnectionProxy<Repository<E>['methods']['set']>(
    async entity => {
      const { _id, ...props } = converter.to(entity)

      const result = await coll.updateOne(
        { _id: _id },
        { $set: props },
        { upsert: true },
      )

      return result.upsertedCount
        ? converter.from(
            await coll.findOne({ _id: result.upsertedId! }, { projection }),
          )
        : entity
    },
  )

  const remove = verifyConnectionProxy<Repository<E>['methods']['remove']>(
    async id => {
      await coll.deleteOne({ _id: new ObjectId(id) })
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

      return (await find.toArray()).map(converter.from)
    },
  )

  const batch = verifyConnectionProxy<Repository<E>['methods']['batch']>(
    async b => {
      const bulk = b.map(item => {
        if (item.type === 'remove')
          return {
            deleteOne: {
              filter: { _id: new ObjectId(item.data.id) },
            },
          }

        const { _id, ...props } = converter.to(item.data)

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

  const clear = verifyConnectionProxy<MongoDBRepository<E>['infra']['clear']>(
    async () => {
      await coll.drop()
    },
  )

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
      _t: MongoDBRepositoryURI,
    },
    methods: {
      get,
      set,
      remove,
      query,
      batch,
    },
    infra: {
      connect,
      disconnect,
      clear,
    },
  }
}

async function isConnected(client?: MongoDB.MongoClient) {
  if (!client || !client.db()) {
    return false
  }
  try {
    const res = await client.db().admin().ping()
    return res.ok === 1
  } catch {
    return false
  }
}

// -------------
// Where Helpers
// -------------

function whereAdaptToFindQuery(where: Where<any>): any {
  return isComposite(where)
    ? whereCompositeAdapter(where)
    : whereLeafAdapter(where)
}

function whereCompositeAdapter(where: WhereComposite<any>) {
  const operator = where.value === 'and' ? '$and' : '$or'
  const wheres = [
    whereAdaptToFindQuery(where.left),
    whereAdaptToFindQuery(where.right),
  ]
  return { [operator]: wheres }
}

function whereLeafAdapter(where: WhereLeaf<any>) {
  let { fieldname, value } = where.value
  const { operator } = where.value

  if (fieldname === 'id') {
    fieldname = '_id'

    if (value instanceof Array) value = value.map(v => new ObjectId(v))
    if (typeof value === 'string') value = new ObjectId(value)
  }

  if (operator === 'array-contains') return { [fieldname]: value }

  if (operator === 'between')
    return { [fieldname]: { $gte: value.start, $lte: value.end } }

  const operatorMapper = {
    '==': '$eq',
    '!=': '$ne',
    '>': '$gt',
    '>=': '$gte',
    '<': '$lt',
    '<=': '$lte',
    in: '$in',
    'not-in': '$nin',
    'array-contains-any': '$in',
  }

  return { [fieldname]: { [operatorMapper[operator]]: value } }
}

// -------------
// Sorts Helpers
// -------------

function applySorts(sorts: Sort<any>[]): any {
  return sorts.reduce(
    (acc, { property, direction }) => (
      (acc[property as any] = direction === 'asc' ? 1 : -1),
      acc
    ),
    {} as any,
  )
}
