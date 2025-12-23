/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
  bucket: string
}

export interface SignedUrlResult extends StorageResult {
  url: string
  expires_at: Date
}

export interface Storage {
  readonly upload: (data: UploadData) => Promise<StorageResult>
  readonly download: (data: DownloadData) => Promise<Buffer | undefined>
  readonly check: (id: string) => Promise<boolean>
  readonly getSignedUrl: () => Promise<SignedUrlResult>
}
