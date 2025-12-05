import { number, string } from 'yup'
import { Handler, isLeft, Repository, Response } from '@davna/core'

import { Audio, SUPORTED_MIME_TYPE } from '../entities/audio'
import { uploadAudio } from '../services/upload.audio'
import { StorageConstructor } from '../utils/storage'
import { MultimediaProvider } from '../providers'
import { STORAGE_TYPE } from '@davna/providers'

interface Env {
  audios: Repository<Audio>
  storage: StorageConstructor
  multimedia: MultimediaProvider
  storage_driver: STORAGE_TYPE
}

export const uploadAudioHandler = Handler(request => async (env: Env) => {
  const {
    file,
    account: { id: owner_id },
  } = request.metadata

  const converted = await env.multimedia.convert({
    buffer: file.buffer,
    name: file.originalname,
    mime: file.mimetype,
  })

  const { buffer } = converted
  let { name, mime, duration } = converted

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
    buffer,
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
