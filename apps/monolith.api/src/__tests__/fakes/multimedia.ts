/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MultimediaProvider } from '@davna/classroom'

export function makeMultimedia(): MultimediaProvider {
  const convert: MultimediaProvider['convert'] = async ({
    buffer,
    mime,
    name,
  }) => ({
    buffer,
    codec: 'aac',
    duration: 12.154,
    format: 'mp4',
    mime,
    name,
  })

  const metadata: MultimediaProvider['metadata'] = async ({ mime, name }) => ({
    codec: 'aac',
    duration: 12.154,
    format: 'mp4',
    mime,
    name,
  })

  return {
    convert,
    metadata,
  }
}
