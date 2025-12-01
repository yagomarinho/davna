import type { ResponseData } from './audio.metadata.provider'

import path from 'node:path'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import ffprobe from 'ffprobe-static'

export function getDuration() {
  const candidates = [
    process.env.FFPROBE_PATH,
    ffprobe && ffprobe.path,
    path.resolve(
      process.cwd(),
      'node_modules/ffprobe-static',
      'bin/linux/x64/ffprobe',
    ),
    '/usr/bin/ffprobe',
    '/usr/local/bin/ffprobe',
  ].filter(Boolean)

  const ffprobePath = candidates.find(
    p => typeof p === 'string' && existsSync(p),
  )

  if (!ffprobePath) {
    throw new Error(
      `ffprobe binary not found. Tried: ${candidates.filter(Boolean).join(', ')}. ` +
        `Install ffmpeg/ffprobe in the system (apk/apt) or set FFPROBE_PATH to the binary.`,
    )
  }

  return (buffer: Buffer<ArrayBufferLike>): Promise<ResponseData> =>
    new Promise((resolve, reject) => {
      const p = spawn(ffprobePath, [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        '-i',
        'pipe:0',
      ])

      let out = ''
      p.stdout.on('data', d => (out += d.toString()))

      p.on('close', code => {
        if (code !== 0) return reject('ffprobe failed')
        resolve({
          duration: parseFloat(out.trim()),
        })
      })

      p.on('error', err => {
        reject(err)
      })

      p.stdin.write(buffer)
      p.stdin.end()
    })
}
