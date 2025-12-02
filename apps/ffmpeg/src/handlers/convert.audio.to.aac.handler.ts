import { resolve } from 'node:path'
import { rm, writeFile } from 'node:fs/promises'
import { Handler, Response } from '@davna/core'

import type { AudioMetadataProvider } from '../providers/audio.metadata.provider'
import type { Audio } from '../services/convert.audio.to.aac'

interface Env {
  audioMetadata: AudioMetadataProvider
  config: {
    tempDir: string
  }
}

export const convertAudioToAACtaHandler = Handler(
  request =>
    async ({ audioMetadata, config }: Env) => {
      const {
        file: { buffer, mimetype: mime, originalname: name },
      } = request.metadata

      const tempName = `tmp-${name}.${mime.split('/').filter(Boolean).slice(-1)[0] ?? ''}`
      const filePath = resolve(config.tempDir, tempName)

      await writeFile(filePath, buffer, { flag: 'w' })

      let audio: Audio

      try {
        audio = await audioMetadata.convertAudioToAAC(filePath, {
          mime,
          filename: 'output',
        })
      } catch {
        rm(filePath)
        return Response({
          data: { message: 'Invalid Audio File Type' },
          metadata: { headers: { status: 400 } },
        })
      }

      rm(filePath)

      const { format, codec, duration, buffer: converted } = audio

      return Response.data({
        buffer: converted,
        name,
        duration,
        format,
        codec,
        mime: 'audio/mp4',
      })
    },
)
