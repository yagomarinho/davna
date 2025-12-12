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
