import { number, string } from 'yup'
import { Handler } from '../../../shared/core/handler'
import { Repository } from '../../../shared/core/repository'
import { Response } from '../../../shared/core/response'
import { Audio, SUPORTED_MIME_TYPE } from '../entities/audio'
import { StorageConstructor } from '../../../shared/providers/storage/storage'
import { uploadAudio } from '../services/upload.audio'
import { isLeft } from '../../../shared/core/either'

interface Env {
  audios: Repository<Audio>
  storage: StorageConstructor
}

export const uploadAudioHandler = Handler(request => async (env: Env) => {
  const {
    file,
    account: { id: owner_id },
    headers,
  } = request.metadata

  let name: string, mime: string, duration: number

  name = file.originalname
  mime = file.mimetype
  duration = headers['x-duration'] as any as number

  try {
    name = await string().required().validate(name)
    mime = await string<SUPORTED_MIME_TYPE>()
      .oneOf(Object.values(SUPORTED_MIME_TYPE))
      .required()
      .validate(mime)
    duration = number().required().cast(duration)
  } catch {
    return Response({
      data: { message: 'Invalid metadata' },
      metadata: {
        headers: {
          status: 400,
        },
      },
    })
  }

  if (!file)
    return Response({
      data: { message: 'Audio file is missing' },
      metadata: {
        headers: {
          status: 400,
        },
      },
    })

  if (!Buffer.isBuffer(file.buffer))
    return Response({
      data: { message: 'Invalid file shape' },
      metadata: {
        headers: {
          status: 400,
        },
      },
    })

  const result = await uploadAudio({
    buffer: file.buffer,
    duration,
    mime,
    name,
    owner_id,
  })(env)

  if (isLeft(result))
    return Response({
      data: { message: result.value.message },
      metadata: {
        headers: {
          status: 400,
        },
      },
    })

  return Response.data(result.value)
})
