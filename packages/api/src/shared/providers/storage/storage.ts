import type { Readable } from 'node:stream'
import { MongoDBStorage } from './mongodb.storage'
import { AWSS3Storage } from './aws.s3.storage'
import config from '../../../config'

export enum STORAGE_TYPE {
  AWS_S3 = 'aws.s3',
  MONGO_GRIDFS = 'mongodb',
}

interface AudioMetadata {
  name: string
  mime: string
  duration: number
  owner_id: string
}

type Metadata = AudioMetadata

export interface UploadData {
  source: Readable
  metadata: Metadata
}

export interface DownloadData {
  identifier: string
}

export interface StorageResult {
  storage_type: STORAGE_TYPE
  identifier: string
}

export interface Storage {
  readonly upload: (data: UploadData) => Promise<StorageResult>
  readonly download: (data: DownloadData) => Promise<Buffer | undefined>
  readonly check: (id: string) => Promise<boolean>
}

export interface Config {
  driver?: STORAGE_TYPE
}

export interface StorageConstructor {
  (config: Config): Storage
}

export const Storage: StorageConstructor = ({
  driver = process.env.STORAGE_DRIVER_DEFAULT as any,
}) => {
  const drivers = {
    [STORAGE_TYPE.MONGO_GRIDFS]: MongoDBStorage,
    [STORAGE_TYPE.AWS_S3]: AWSS3Storage,
  }

  const configs = {
    [STORAGE_TYPE.MONGO_GRIDFS]: config.providers.storage.mongodb,
    [STORAGE_TYPE.AWS_S3]: config.providers.storage.awsS3,
  }

  const conf = configs[driver] as any

  return drivers[driver](conf)
}
