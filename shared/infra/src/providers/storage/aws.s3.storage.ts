/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { Storage, STORAGE_TYPE } from './storage'

export const AWSS3 = 'aws.s3'
export type AWSS3 = typeof AWSS3

interface AWSCredentials {
  accessKeyId: string
  secretAccessKey: string
}

export interface AWSS3Config {
  region: string
  bucket: string
  credentials: AWSCredentials
}

export function AWSS3Storage({
  bucket,
  region,
  credentials,
}: AWSS3Config): Storage {
  const client = new S3Client({
    region,
    credentials,
  })

  const download: Storage['download'] = async ({ identifier }) => {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: identifier,
      }),
    )

    if (!response.Body) return

    const stream = response.Body.transformToWebStream()

    return streamToBuffer(stream)
  }

  const upload: Storage['upload'] = async ({
    metadata: { name, duration, mime, owner_id },
    source,
  }) => {
    const identifier = `${new Date().toISOString()}-${name}`

    const up = new Upload({
      client,
      params: {
        Bucket: bucket,
        Key: identifier,
        Body: source,
        ContentType: mime,
        Metadata: {
          duration: duration.toString(),
          owner_id,
        },
      },
      queueSize: 4,
      partSize: 5 * 1024 * 1024,
    })

    const result = await up.done()

    return {
      identifier: result.Key ?? identifier,
      storage_type: STORAGE_TYPE.AWS_S3,
      bucket,
    }
  }

  const check: Storage['check'] = async identifier => {
    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: identifier,
        }),
      )

      return true
    } catch (err: any) {
      if (
        (err?.name && err.name === 'NotFound') ||
        err.$metadata?.httpStatusCode === 404
      ) {
        return false
      }

      throw err
    }
  }

  // Implementar o signedUrl para o aws.s3
  const getSignedUrl: Storage['getSignedUrl'] = async () => ({}) as any

  return {
    download,
    upload,
    check,
    getSignedUrl,
  }
}

export async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader()
  const chunks: any[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  return Buffer.concat(chunks)
}
