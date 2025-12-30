/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AuthContext,
  Handler,
  isLeft,
  Response,
  SagaRepositoryProxy,
  UnitOfWorkSaga,
} from '@davna/core'
import { Storage } from '@davna/infra'
import { Duration } from '@davna/kernel'

import { ClassroomFedRepository } from '../../repositories'
import { CONFIDENCE, SUPPORTED_MIME_TYPE } from '../../entities'
import {
  authorizeConsumption,
  createPresignedAudio,
  getParticipantBySubjectId,
} from '../../services'

import { audioDTOfromGraph } from '../../dtos'
import { ensureDurationInSeconds } from '../../utils'
import { Scheduler } from '../../providers'

interface Data {
  mime_type: SUPPORTED_MIME_TYPE
  duration: Duration
}

interface Metadata {
  query?: { confidence?: CONFIDENCE }
  auth: AuthContext
}

interface Env {
  repository: ClassroomFedRepository
  storage: Storage
  scheduler: Scheduler
}

export const createPresignedAudioHandler = Handler<Env, Data, Metadata>(
  ({ data, metadata }) =>
    async env => {
      const { duration, mime_type } = data
      const { storage, scheduler } = env
      const {
        auth: { actor, principal },
        query: { confidence = CONFIDENCE.DETERMINISTIC } = {},
      } = metadata

      const accountParticipantResult = await getParticipantBySubjectId({
        subject_id: principal.account.id,
      })({ repository: env.repository })

      const actorParticipantResult = await getParticipantBySubjectId({
        subject_id: actor.subject_id,
      })({ repository: env.repository })

      if (isLeft(accountParticipantResult) || isLeft(actorParticipantResult))
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
          owner_id: actorParticipantResult.value.meta.id,
          confidence,
        })({
          repository,
          storage,
        })

        if (isLeft(createAudioResult)) throw new Error('Invalid result')

        const { audio, ownership } = createAudioResult.value

        await scheduler.schedule({
          type: 'handle_expired_audio',
          run_at: audio.props.metadata.props.expires_at,
          payload: { audio_id: audio.meta.id },
        })

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
