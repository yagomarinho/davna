/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { resolve } from 'node:path'
import ffprobe from 'ffprobe-static'

import { ensurePath } from './ensure.path'

export function ffprobePath() {
  const candidates = [
    process.env.FFPROBE_PATH,
    ffprobe?.path,
    resolve(process.cwd(), 'node_modules/ffprobe-static/bin/linux/x64/ffprobe'),
    '/usr/bin/ffprobe',
    '/usr/local/bin/ffprobe',
  ].filter(Boolean) as string[]

  return ensurePath({ candidates })
}
