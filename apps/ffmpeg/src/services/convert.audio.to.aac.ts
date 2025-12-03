import { spawn } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { Readable } from 'node:stream'
import nodePath from 'node:path'

import { AudioLike } from '../providers/audio.metadata.provider'
import { toBuffer } from '../utils/to.buffer'
import { ffmpegPath } from '../utils/ffmpeg.path'
import { ensurePath } from '../utils/ensure.path'
import { AudioInfo, getAudioMetadata } from './get.audio.metadata'
import { readFileAsBuffer } from '../utils/read.file.as.buffer'
import { randomId } from '../utils/random.id'

export interface Audio extends AudioInfo {
  name: string
  buffer: Buffer
}

export interface ConvertToAccOptions {
  timeoutMs?: number
  mime: string
  filename?: string
}

export function convertAudioToAAC({ tempDir }: { tempDir: string }) {
  const DEFAULT_TIMEOUT_MS = 10_000
  const path = ffmpegPath()

  return (input: AudioLike, opts: ConvertToAccOptions): Promise<Audio> =>
    new Promise((resolve, reject) => {
      const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS

      const useFilePath = typeof input === 'string'
      const outputPath = opts.filename
        ? nodePath.resolve(tempDir, `${randomId()}-${opts.filename}.mp4`)
        : undefined

      const args = (
        useFilePath
          ? ['-i', input as string, '-vn', '-c:a', 'aac', '-b:a', '128k']
          : ['-i', 'pipe:0', '-vn', '-c:a', 'aac', '-b:a', '128k']
      ).concat(outputPath ? [outputPath] : ['-f', 'mp4', 'pipe:1'])

      const p = spawn(path, args, { stdio: ['pipe', 'pipe', 'pipe'] })

      const chunks: Buffer[] = []
      let err = ''
      let finished = false
      const childClosed = false

      const killAndReject = async (reason: any) => {
        finished = true

        if (outputPath) {
          const exists = ensurePath({
            candidates: [outputPath],
            early: false,
          })

          if (exists) await rm(exists)
        }

        try {
          p.kill('SIGKILL')
        } catch (_) {
          // eslint-disable-next-line no-console
          console.error(_)
        }

        reject(typeof reason === 'string' ? new Error(reason) : reason)
      }

      const timer = setTimeout(() => {
        killAndReject(new Error(`ffmpeg timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      p.stdout.on('data', chunk => chunks.push(chunk))
      p.stderr.on('data', c => (err += c.toString()))

      p.stdin.on('error', (err: any) => {
        const errMsg = new Error(
          `stdin error (possible EPIPE). code=${err?.code} stderr=${err?.message || err?.toString()}`,
        )
        if (!finished) killAndReject(errMsg)
      })

      p.on('close', code => {
        clearTimeout(timer)
        if (finished) return

        if (code !== 0) {
          return killAndReject(`ffmpeg exited with code ${code}: ${err.trim()}`)
        }

        if (outputPath) {
          const exists = ensurePath({
            candidates: [outputPath],
            early: false,
          })

          if (exists) {
            return readFileAsBuffer(exists)
              .then(async buffer => {
                rm(exists)

                const metadata = await getAudioMetadata()(buffer)
                return resolve({ ...metadata, buffer, name: opts.filename! })
              })
              .catch(killAndReject)
          }
        }

        finished = true
        if (!err) {
          const buffer = Buffer.concat(chunks)
          return getAudioMetadata()(buffer).then(metadata =>
            resolve({
              ...metadata,
              buffer,
              name: 'rec_' + new Date().toISOString(),
            }),
          )
        }

        return killAndReject(
          `ffmpeg output parse failed. stderr: ${err.trim()}`,
        )
      })

      if (!useFilePath) {
        const buf = toBuffer(input)
        if (!buf) {
          clearTimeout(timer)
          return killAndReject(
            'input must be Buffer | ArrayBuffer | Uint8Array | Readable | filePath',
          )
        }

        function safeWriteBuffer(buffer: Buffer) {
          if (childClosed) {
            return killAndReject(
              'ffmpeg already closed before write (childClosed)',
            )
          }

          const rs = Readable.from(buffer)

          rs.on('error', e => {
            if (!finished)
              killAndReject(`readable error before piping to ffmpeg: ${e}`)
          })

          rs.pipe(p.stdin).on('error', e => {
            if (!finished) {
              const combined = new Error(
                `pipe to ffmpeg failed: ${e?.message}. stderr=${err}`,
              )
              killAndReject(combined)
            }
          })
        }

        if (input instanceof Readable) {
          if (childClosed)
            return killAndReject(
              new Error('ffmpeg closed before input stream could pipe'),
            )
          ;(input as Readable).on('error', e => {
            if (!finished) killAndReject(new Error(`input stream error: ${e}`))
          })
          ;(input as Readable).pipe(p.stdin).on('error', e => {
            if (!finished)
              killAndReject(new Error(`pipe to ffmpeg failed: ${e?.message}`))
          })
        } else {
          safeWriteBuffer(buf)
        }
      } else {
        p.stdin.end()
      }
    })
}
