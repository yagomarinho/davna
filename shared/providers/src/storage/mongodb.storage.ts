import { GridFSBucket, MongoClient, ObjectId } from 'mongodb'
import { Storage, STORAGE_TYPE, StorageResult } from './storage'

export const MONGODB = 'mongodb'
export type MONGODB = typeof MONGODB

export enum CONNECTION_STATUS {
  READY,
  CONNECTED,
  DISCONNECTED,
}

export interface MongoDBStorage extends Storage {
  readonly connect: () => Promise<void>
  readonly disconnect: () => Promise<void>
  readonly clear: () => Promise<void>
}

export interface MongoDBClientConfig {
  client: MongoClient
  database: string
  bucket: string
}

export interface MongoDBConfig {
  uri: string
  database: string
  bucket: string
}

export function MongoDBStorage(config: MongoDBClientConfig): MongoDBStorage
export function MongoDBStorage(config: MongoDBConfig): MongoDBStorage
export function MongoDBStorage(config: any): MongoDBStorage {
  const client: MongoClient = config.client ?? new MongoClient(config.uri)
  let bucket: GridFSBucket

  let status = CONNECTION_STATUS.READY

  const connect: MongoDBStorage['connect'] = async () => {
    if (status === CONNECTION_STATUS.DISCONNECTED)
      throw new Error('Connection Finished')

    if (status === CONNECTION_STATUS.READY) {
      if (await isConnected(client)) {
        status = CONNECTION_STATUS.CONNECTED

        getBucket(client)
        return
      }
    }

    function getBucket(mongo: MongoClient) {
      const db = mongo.db(config.database)
      bucket = new GridFSBucket(db, { bucketName: config.bucket })
    }

    const connection = await client.connect()

    getBucket(connection)

    status = CONNECTION_STATUS.CONNECTED
  }

  const disconnect = verifyConnectionProxy<MongoDBStorage['disconnect']>(
    async () => {
      await client.close()
      status = CONNECTION_STATUS.DISCONNECTED
    },
  )

  const upload: MongoDBStorage['upload'] = verifyConnectionProxy(
    ({
      source,
      metadata: { duration, mime, name, owner_id },
    }): Promise<StorageResult> =>
      new Promise((resolve, reject) => {
        const target = bucket.openUploadStream(name, {
          contentType: mime,
          metadata: {
            duration,
            owner_id,
          },
        })

        source
          .pipe(target)
          .on('error', reject)
          .on('finish', () => {
            const id = target.id.toString()
            resolve({
              identifier: id,
              storage_type: STORAGE_TYPE.MONGO_GRIDFS,
            })
          })
      }),
  )

  const download: MongoDBStorage['download'] = verifyConnectionProxy(
    async ({ identifier }): Promise<Buffer<ArrayBufferLike> | undefined> => {
      try {
        const id = new ObjectId(identifier)
        const chunks = await bucket.find({ _id: id }).toArray()

        if (!chunks.length) throw new Error()

        const source = bucket.openDownloadStream(id)

        return new Promise((resolve, reject) => {
          const data: Buffer<ArrayBufferLike>[] = []

          source
            .on('data', chunk => {
              if (Buffer.isBuffer(chunk)) data.push(chunk)
            })
            .on('end', () => {
              resolve(Buffer.concat(data))
            })
            .on('error', reject)
        })
      } catch {
        return
      }
    },
  )

  const check: MongoDBStorage['check'] = verifyConnectionProxy(
    async (id): Promise<boolean> => {
      const _id = new ObjectId(id)
      const chunks = await bucket.find({ _id }).toArray()

      return !!chunks.length
    },
  )

  function verifyConnectionProxy<F extends (...args: any[]) => any>(
    fn: F,
  ): (...args: Parameters<F>) => any {
    return async (...args) => {
      if (status === CONNECTION_STATUS.READY) {
        await connect()
      }

      if (status === CONNECTION_STATUS.DISCONNECTED)
        throw new Error('connection finished')

      return fn(...args)
    }
  }

  const clear = verifyConnectionProxy<MongoDBStorage['clear']>(async () => {
    await bucket.drop()
  })

  return {
    connect,
    disconnect,
    clear,
    upload,
    download,
    check,
  }
}

async function isConnected(client?: MongoClient) {
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
