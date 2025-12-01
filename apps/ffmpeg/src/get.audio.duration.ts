import type { AudioMetadataProvider } from './audio.metadata.provider'
import { Handler, Response } from '@davna/core'

interface Env {
  audioMetadata: AudioMetadataProvider
}

export const getDurationHandler = Handler(
  request =>
    async ({ audioMetadata }: Env) => {
      const { file } = request.metadata

      try {
        const { duration } = await audioMetadata.getDuration(file.buffer)

        return Response.data({
          name: file.originalname,
          mime: file.mimetype,
          duration,
        })
      } catch {
        return Response({
          data: { message: 'Invalid Audio File Type' },
          metadata: { headers: { status: 400 } },
        })
      }
    },
)
