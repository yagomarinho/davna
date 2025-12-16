/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MultimediaProvider } from '@davna/classroom'
import { ffmpeg } from '@davna/ffmpeg.sdk'

export function Multimedia(): MultimediaProvider {
  const metadata: MultimediaProvider['metadata'] = async ({
    buffer,
    mime,
    name,
  }) => {
    const result = await ffmpeg().getMetadata({ audio: buffer, mime, name })
    if (!result) throw new Error('Invalid audio file to get metadata')
    return result
  }

  const convert: MultimediaProvider['convert'] = async ({
    buffer,
    mime,
    name,
  }) => {
    const result = await ffmpeg().convertAudioToAAC({
      audio: buffer,
      mime,
      name,
    })

    if (!result) throw new Error('Invalid audio file to get metadata')

    return result
  }

  return {
    metadata,
    convert,
  }
}
