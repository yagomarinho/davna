/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { resolve } from 'node:path'
import type { AudioMetadataProvider } from '../providers/audio.metadata.provider'
import { convertAudioToAAC } from '../services/convert.audio.to.aac'
import { getAudioMetadata } from '../services/get.audio.metadata'

export type Config = {
  tempDir: string
  auth: {
    apiKey: {
      headerName: string
      key: string
    }
  }
}

export type Env = {
  config: Config
  providers: {
    audioMetadata: AudioMetadataProvider
  }
}

export const Env = (): Env => {
  const tempDir = resolve(__dirname, process.env.RELATIVE_TMP_DIR_PATH!)
  return {
    providers: {
      audioMetadata: {
        getMetadata: getAudioMetadata(),
        convertAudioToAAC: convertAudioToAAC({ tempDir }),
      },
    },
    config: {
      tempDir,
      auth: {
        apiKey: {
          headerName: process.env.API_KEY_HEADER_NAME || 'x-api-key',
          key: process.env.API_ACCESS_TOKEN || 'default_access_token',
        },
      },
    },
  }
}
