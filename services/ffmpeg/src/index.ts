/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Config, DEFAULT_CONFIG } from './config'

import { convertAudioToAAC, ConvertRequest } from './convert.audio.to.aac'
import { MetadataRequest, getMetadata } from './get.metadata'
import { healthy } from './healthy'

interface Options {
  config?: Config
}

export function ffmpeg({ config }: Options = {}) {
  const c = config ?? DEFAULT_CONFIG()
  return {
    convertAudioToAAC: (data: ConvertRequest) =>
      convertAudioToAAC({ data, config: c }),
    getMetadata: (data: MetadataRequest) => getMetadata({ data, config: c }),
    healthy: () => healthy({ config: c }),
  }
}
