import { Handler, isLeft, Repository, Response } from '@davna/core'

import { Audio } from '../entities/audio'
import { downloadAudio } from '../services/download.audio'
import { StorageConstructor } from '../utils/storage'

interface Env {
  audios: Repository<Audio>
  storage: StorageConstructor
}

export const downloadAudioHandler = Handler(request => async (env: Env) => {
  const { id: audio_id } = request.metadata.params

  const result = await downloadAudio({ audio_id })(env)

  if (isLeft(result))
    return Response({
      data: { message: result.value.message },
      metadata: {
        headers: {
          status: 400,
        },
      },
    })

  const { mime, buffer } = result.value

  const headers = {
    'Content-Type': mime,
    'Content-Length': buffer.length.toString(),
  }

  return Response({
    data: buffer,
    metadata: { headers },
  })
})
