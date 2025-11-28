import { Readable } from 'node:stream'
import { string } from 'yup'
import { Left, Repository, Right, Service } from '@davna/core'

import { Audio, SUPORTED_MIME_TYPE } from '../entities/audio'
import { StorageConstructor } from '../utils/storage'

interface Request {
  owner_id: string
  name: string
  mime: string
  duration: number
  buffer: Buffer
}

interface Env {
  storage: StorageConstructor
  audios: Repository<Audio>
}

export const uploadAudio = Service<Request, Env, Audio>(
  ({ owner_id, name, mime: MIME, duration, buffer }) =>
    async ({ storage, audios }) => {
      let mime: SUPORTED_MIME_TYPE

      try {
        mime = await string<SUPORTED_MIME_TYPE>()
          .oneOf(Object.values(SUPORTED_MIME_TYPE))
          .required()
          .validate(MIME)
      } catch {
        return Left({
          status: 'error',
          message: `Unsupported MimeType: ${MIME}`,
        })
      }

      const source = Readable.from(buffer)

      const { identifier, storage_type } = await storage({
        driver: process.env.STORAGE_DRIVER_DEFAULT! as any,
      }).upload({
        source,
        metadata: {
          mime,
          duration,
          name,
          owner_id,
        },
      })

      let audio = Audio.create({
        owner_id,
        name,
        mime,
        src: '',
        internal_ref: { storage: storage_type, identifier },
        duration,
      })

      audio = await audios.set(audio)

      audio = Audio.create({
        ...audio,
        src: `${process.env.API_BASE_URL}/audio/download/${audio.id}`,
      })

      audio = await audios.set(audio)

      return Right(audio)
    },
)
