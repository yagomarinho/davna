import { Left, Right, Service } from '@davna/core'
import { Audio, AudioURI } from '../../entities'
import { ClassroomFedRepository } from '../../repositories'

interface Data {
  audio_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

export const getAudio = Service<Data, Env, Audio>(
  ({ audio_id }) =>
    async ({ repository }) => {
      const audio = await repository.methods.get(audio_id)

      if (!audio || audio._t !== AudioURI)
        return Left({
          status: 'error',
          message: 'Audio not founded',
        })

      return Right(audio)
    },
)
