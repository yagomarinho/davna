import { Left, Repository, Right, Service } from '@davna/core'

import { Audio } from '../entities/audio'

interface Request {
  audio_id: string
}

interface Response {
  mime: string
  buffer: Buffer
}

interface Env {
  storage: StorageConstructor
  audios: Repository<Audio>
}

export const downloadAudio = Service<Request, Env, Response>(
  ({ audio_id }) =>
    async ({ storage, audios }) => {
      const audio = await audios.get(audio_id)

      if (!audio) return Left({ status: 'error', message: 'Audio not found' })

      const buffer = await storage({
        driver: audio.internal_ref.storage,
      }).download({
        identifier: audio.internal_ref.identifier,
      })

      if (!buffer) return Left({ status: 'error', message: 'Audio not found' })

      return Right({
        mime: audio.mime,
        buffer,
      })
    },
)
