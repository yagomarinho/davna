/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ffmpeg from 'ffmpeg-static'
import { resolve } from 'node:path'
import { ensurePath } from './ensure.path'

export function ffmpegPath() {
  const candidates = [
    ffmpeg,
    process.env.FFMPEG_PATH,
    resolve(process.cwd(), 'node_modules/ffmpeg-static', 'ffmpeg'),
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
  ].filter(Boolean) as string[]

  return ensurePath({ candidates })
}
