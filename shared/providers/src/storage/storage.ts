import type { Readable } from 'node:stream'

export enum STORAGE_TYPE {
  AWS_S3 = 'aws.s3',
  MONGO_GRIDFS = 'mongodb',
}

export interface AudioMetadata {
  name: string
  mime: string
  duration: number
  owner_id: string
}

export type Metadata = AudioMetadata

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
