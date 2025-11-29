/* eslint-disable @typescript-eslint/no-unused-vars */
import ffmpeg from 'ffmpeg-static'
import ffprobe from 'ffprobe-static'
import { spawn } from 'child_process'

interface ResponseData {
  duration: number
}

export function getDuration(
  buffer: Buffer<ArrayBufferLike>,
): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    const p = spawn(ffprobe.path, [
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

    p.stdin.write(buffer)
    p.stdin.end()
  })
}
