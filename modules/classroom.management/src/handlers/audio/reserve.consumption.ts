/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Handler,
  Identifiable,
  isLeft,
  Response,
  SagaRepositoryProxy,
  UnitOfWorkSaga,
} from '@davna/core'
import { ClassroomFedRepository } from '../repositories'
import { SUPORTED_MIME_TYPE, USAGE_UNITS } from '../entities'
import { authorizeConsumption } from '../services/usage/authorize.consumption'
import { Storage } from '@davna/infra'
import { createPresignedAudio } from '../services/audio/create.presigned.audio'
import { audioDTOfromGraph } from '../dtos'

interface Metadata {
  account: Identifiable
}

interface Data {
  mime_type: SUPORTED_MIME_TYPE
  duration: {
    unit: USAGE_UNITS.SECONDS
    value: number
  } // Já receber o duration in seconds
}

interface Env {
  repository: ClassroomFedRepository
  storage: Storage
}

export const reserveConsumptionHandler = Handler<Env, Data, Metadata>(
  request => async env => {
    const owner_id = request.metadata.account.id
    const { duration, mime_type } = request.data
    const { storage } = env

    const authorizedResult = await authorizeConsumption({
      owner_id,
      requested_consumption: duration.value,
    })({ repository: env.repository })

    if (isLeft(authorizedResult))
      return Response({
        metadata: { headers: { status: 401 } },
        data: { message: 'Has no consumption left. Try again later' },
      })

    const uow = UnitOfWorkSaga()
    try {
      const repository = SagaRepositoryProxy(env.repository, uow)

      const createAudioResult = await createPresignedAudio({
        duration,
        mime_type,
        owner_id,
      })({
        repository,
        storage,
      })

      if (isLeft(createAudioResult)) throw new Error('Invalid result')

      const { audio, ownership } = createAudioResult.value

      return Response.data({
        audio: audioDTOfromGraph({ audio, ownership }),
        presigned_url: {
          url: audio.props.metadata.props.presignedUrl,
          expires_at: audio.props.metadata.props.expires_at,
        },
      })
    } catch (e: any) {
      await uow.rollback()
      throw e
    }
  },
)
