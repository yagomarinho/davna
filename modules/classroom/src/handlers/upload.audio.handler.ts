import { number, string } from 'yup'
import { Handler, isLeft, Repository, Response } from '@davna/core'
import { getDuration } from '../utils'

import { Audio, SUPORTED_MIME_TYPE } from '../entities/audio'
import { uploadAudio } from '../services/upload.audio'
import { StorageConstructor } from '../utils/storage'

interface Env {
  audios: Repository<Audio>
  storage: StorageConstructor
}

export const uploadAudioHandler = Handler(request => async (env: Env) => {
  const {
    file,
    account: { id: owner_id },
  } = request.metadata

  let name: string, mime: string, duration: number

  name = file.originalname
  mime = file.mimetype
  duration = await getDuration({ buffer: file.buffer })

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
