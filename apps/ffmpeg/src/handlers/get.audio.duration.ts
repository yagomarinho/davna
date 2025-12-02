import { resolve } from 'node:path'
import { rm, writeFile } from 'node:fs/promises'
import { Handler, Response } from '@davna/core'

import type { AudioMetadataProvider } from '../providers/audio.metadata.provider'

interface Env {
  audioMetadata: AudioMetadataProvider
}

export const getDurationHandler = Handler(
  request =>
    async ({ audioMetadata }: Env) => {
      const {
        file: { buffer, mimetype: mime, originalname: name },
      } = request.metadata

      try {
        const relativeTempPath = '../../temp'
        const dirPath = resolve(__dirname, relativeTempPath)

        const path = resolve(
          dirPath,
          `${name}.${mime.split('/').filter(Boolean).slice(-1)[0] ?? ''}`,
        )

        await writeFile(path, buffer, { flag: 'w' })

        const { duration } = await audioMetadata.getDuration(path)

        rm(path)
        return Response.data({
          name,
          mime,
          duration,
        })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        return Response({
          data: { message: 'Invalid Audio File Type' },
          metadata: { headers: { status: 400 } },
        })
      }
    },
)
