import { Handler } from '../../../shared/core/handler'
import { Repository } from '../../../shared/core/repository'
import { Response } from '../../../shared/core/response'
import { Audio } from '../entities/audio'
import { StorageConstructor } from '../../../shared/providers/storage/storage'
import { downloadAudio } from '../services/download.audio'
import { isLeft } from '../../../shared/core/either'

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
