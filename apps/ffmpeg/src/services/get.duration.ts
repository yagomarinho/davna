import { spawn } from 'node:child_process'
import { Readable } from 'node:stream'

import type {
  AudioLike,
  ResponseData,
} from '../providers/audio.metadata.provider'
import { toBuffer } from '../utils/to.buffer'
import { ffprobePath } from '../utils/ffprobe.path'

export function getDuration() {
  const DEFAULT_TIMEOUT_MS = 10_000

  const path = ffprobePath()

  return (
    input: AudioLike,
    opts?: { timeoutMs?: number },
  ): Promise<ResponseData> =>
    new Promise((resolve, reject) => {
      const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS

      const useFilePath = typeof input === 'string'

      const args = useFilePath
        ? [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            input as string,
          ]
        : [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            '-i',
            'pipe:0',
          ]

      const p = spawn(path, args, { stdio: ['pipe', 'pipe', 'pipe'] })

      let out = ''
      let err = ''
      let finished = false
      let childClosed = false

      const killAndReject = (reason: any) => {
        if (!finished) {
          finished = true
          try {
            p.kill('SIGKILL')
          } catch (_) {
            // eslint-disable-next-line no-console
            console.error(_)
          }

          reject(reason)
        }
      }

      const timer = setTimeout(() => {
        killAndReject(new Error(`ffprobe timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      p.stdout.on('data', d => (out += d.toString()))
      p.stderr.on('data', d => (err += d.toString()))

      p.stdin.on('error', (err: any) => {
        childClosed = true
        const errMsg = new Error(
          `stdin error (possible EPIPE). code=${err?.code} stderr=${err?.message || err?.toString()}`,
        )
        if (!finished) killAndReject(errMsg)
      })

      p.on('close', code => {
        clearTimeout(timer)
        if (finished) return
        finished = true

        if (code !== 0) {
          return reject(
            new Error(`ffprobe exited with code ${code}: ${err.trim()}`),
          )
        }

        const parsed = parseFloat(out.trim())
        if (Number.isFinite(parsed)) {
          return resolve({ duration: parsed })
        }

        if (!err) {
          return resolve({ duration: 0 })
        }

        return reject(
          new Error(`ffprobe output parse failed. stderr: ${err.trim()}`),
        )
      })

      if (!useFilePath) {
        const buf = toBuffer(input)
        if (!buf) {
          clearTimeout(timer)
          return killAndReject(
            new Error(
              'input must be Buffer | ArrayBuffer | Uint8Array | Readable | filePath',
            ),
          )
        }

        function safeWriteBuffer(buffer: Buffer) {
          if (childClosed) {
            return killAndReject(
              new Error('ffprobe already closed before write (childClosed)'),
            )
          }

          const rs = Readable.from(buffer)

          rs.on('error', e => {
            if (!finished)
              killAndReject(
                new Error(`readable error before piping to ffprobe: ${e}`),
              )
          })

          rs.pipe(p.stdin).on('error', e => {
            if (!finished) {
              const combined = new Error(
                `pipe to ffprobe failed: ${e?.message}. stderr=${err}`,
              )
              killAndReject(combined)
            }
          })
        }

        if (input instanceof Readable) {
          if (childClosed)
            return killAndReject(
              new Error('ffprobe closed before input stream could pipe'),
            )
          ;(input as Readable).on('error', e => {
            if (!finished) killAndReject(new Error(`input stream error: ${e}`))
          })
          ;(input as Readable).pipe(p.stdin).on('error', e => {
            if (!finished)
              killAndReject(new Error(`pipe to ffprobe failed: ${e?.message}`))
          })
        } else {
          safeWriteBuffer(buf)
        }
      } else {
        p.stdin.end()
      }
    })
}
