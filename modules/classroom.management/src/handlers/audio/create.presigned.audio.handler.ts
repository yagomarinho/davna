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
import { Storage } from '@davna/infra'
import { Duration } from '@davna/kernel'

import { ClassroomFedRepository } from '../../repositories'
import { SUPPORTED_MIME_TYPE } from '../../entities'
import { authorizeConsumption } from '../../services/usage/authorize.consumption'
import {
  CONFIDENCE,
  createPresignedAudio,
} from '../../services/audio/create.presigned.audio'
import { audioDTOfromGraph } from '../../dtos'
import { getParticipantBySubjectId } from '../../services'
import { ensureDurationInSeconds } from '../../utils'

interface Data {
  participant_id: string
  mime_type: SUPPORTED_MIME_TYPE
  duration: Duration
  confidence?: CONFIDENCE
}

interface Metadata {
  account: Identifiable
}

interface Env {
  repository: ClassroomFedRepository
  storage: Storage
}

export const createPresignedAudioHandler = Handler<Env, Data, Metadata>(
  ({ data, metadata }) =>
    async env => {
      const {
        participant_id,
        duration,
        mime_type,
        confidence = CONFIDENCE.DETERMINISTIC,
      } = data
      const { storage } = env
      const { id: account_id } = metadata.account

      const accountParticipantResult = await getParticipantBySubjectId({
        subject_id: account_id,
      })({ repository: env.repository })

      if (isLeft(accountParticipantResult))
        return Response({
          metadata: { headers: { status: 401 } },
          data: { message: 'Invalid account id' },
        })

      const { value: time_duration, unit } = ensureDurationInSeconds(duration)

      const authorizedResult = await authorizeConsumption({
        participant_id: accountParticipantResult.value.meta.id,
        usage_unit: unit,
        requested_consumption: time_duration,
      })({ repository: env.repository })

      if (isLeft(authorizedResult))
        return Response({
          metadata: { headers: { status: 403 } },
          data: { message: 'Consumption limit exceeded.. Try again later' },
        })

      const uow = UnitOfWorkSaga()
      try {
        const repository = SagaRepositoryProxy(env.repository, uow)

        const createAudioResult = await createPresignedAudio({
          usage_participant_id: accountParticipantResult.value.meta.id,
          duration: { value: time_duration, unit },
          mime_type,
          owner_id: participant_id,
          confidence,
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
