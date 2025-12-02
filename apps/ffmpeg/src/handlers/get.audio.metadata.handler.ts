import { resolve } from 'node:path'
import { rm, writeFile } from 'node:fs/promises'
import { Handler, Response } from '@davna/core'

import type { AudioMetadataProvider } from '../providers/audio.metadata.provider'
import { AudioInfo } from '../services/get.audio.metadata'

interface Env {
  audioMetadata: AudioMetadataProvider
  config: {
    tempDir: string
  }
}

export const getAudioMetadataHandler = Handler(
  request =>
    async ({ audioMetadata, config }: Env) => {
      const {
        file: { buffer, mimetype: mime, originalname: name },
      } = request.metadata

      const tempName = `tmp-${name}.${mime.split('/').filter(Boolean).slice(-1)[0] ?? ''}`
      const filePath = resolve(config.tempDir, tempName)

      await writeFile(filePath, buffer, { flag: 'w' })
      let metadata: AudioInfo

      try {
        metadata = await audioMetadata.getMetadata(filePath)
      } catch {
        rm(filePath)
        return Response({
          data: { message: 'Invalid Audio File Type' },
          metadata: { headers: { status: 400 } },
        })
      }

      rm(filePath)

      const { format, codec, duration } = metadata
      return Response.data({
        name,
        mime,
        duration,
        format,
        codec,
      })
    },
)
