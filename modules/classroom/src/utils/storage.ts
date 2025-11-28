import {
  AWSS3Storage,
  MongoDBStorage,
  Storage as StorageProvider,
  STORAGE_TYPE,
} from '@davna/providers'

interface Config {
  driver: STORAGE_TYPE
}

export interface StorageConstructor {
  (config: Config): StorageProvider
}

const configs = {
  [STORAGE_TYPE.AWS_S3]: {
    region: process.env.AWS_S3_STORAGE_REGION,
    bucket: process.env.AWS_S3_STORAGE_BUCKET,
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    },
  },
  [STORAGE_TYPE.MONGO_GRIDFS]: {
    uri: process.env.MONGODB_DEFAULT_CONNECT_URI,
    database: process.env.MONGODB_STORAGE_DATABASE,
    bucket: process.env.MONGODB_STORAGE_BUCKET,
  },
}

export const Storage: StorageConstructor = ({ driver }) => {
  const drivers = {
    [STORAGE_TYPE.AWS_S3]: AWSS3Storage,
    [STORAGE_TYPE.MONGO_GRIDFS]: MongoDBStorage,
  }

  const config: any = configs[driver]

  return drivers[driver](config)
}
