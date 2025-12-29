/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Handler,
  isLeft,
  Response,
  SagaRepositoryProxy,
  UnitOfWorkSaga,
} from '@davna/core'
import { concatenate } from '@davna/kernel'
import { messageDTOFromGraph } from '../../dtos'
import { ClassroomFedRepository } from '../../repositories'
import { MultimediaProvider } from '../../providers'
import {
  ensureDurationInSeconds,
  checkDurationTolerance,
  StorageConstructor,
} from '../../utils'
import {
  appendMessageToClassroom,
  ensureClassroomParticipation,
  ensureOwnershipToTargetResource,
  getAudio,
  getParticipant,
  getResourceUsages,
  invalidatePresignedURL,
  persistAudio,
  updateUsage,
} from '../../services'
import { Participant } from '../../entities'
import { Readable } from 'node:stream'

interface AudioInfo {
  id: string
  metadata: { presigned_url: string }
}

interface Data {
  participant_id: string
  classroom_id: string
  resource: AudioInfo // | TextDTO (future implementation)
}

interface Env {
  repository: ClassroomFedRepository
  multimedia: MultimediaProvider
  storage: StorageConstructor
}

export const appendMessageHandler = Handler<Env, Data>(
  ({ data }) =>
    async env => {
      const { multimedia, storage } = env
      const {
        participant_id,
        resource: {
          id: audio_id,
          metadata: { presigned_url },
        },
        classroom_id,
      } = data

      const ensureParticipation = await ensureClassroomParticipation({
        classroom_id,
        participant_id,
      })({ repository: env.repository })

      if (isLeft(ensureParticipation))
        return Response({
          metadata: { headers: { status: 401 } },
          data: { message: ensureParticipation.value.message },
        })

      const participantResult = await getParticipant({
        participant_id,
      })({ repository: env.repository })

      const participant: Participant = participantResult.value as any

      const audioResult = await getAudio({ audio_id })({
        repository: env.repository,
      })

      if (
        isLeft(audioResult) ||
        audioResult.value.props.metadata.props.presigned_url !== presigned_url
      )
        return Response({
          metadata: { headers: { status: 400 } },
          data: { message: 'Invalid audio to append' },
        })

      const audio = audioResult.value

      const ensureAudioOnwershipResult = await ensureOwnershipToTargetResource({
        target: audio,
        owner_id: participant_id,
      })({ repository: env.repository })

      if (isLeft(ensureAudioOnwershipResult)) {
        return Response({
          metadata: { headers: { status: 401 } },
          data: {
            message: ensureAudioOnwershipResult.value.message,
          },
        })
      }

      const audioOwnership = ensureAudioOnwershipResult.value

      const audioUsageResult = await getResourceUsages({
        resource_id: audio.meta.id,
      })({ repository: env.repository })

      if (isLeft(audioUsageResult)) {
        return Response({
          metadata: { headers: { status: 500 } },
          data: { message: 'No resource usage founded' },
        })
      }

      const usages = audioUsageResult.value
      const usage = usages.find(
        u => u.props.metadata.props.presigned_url === presigned_url,
      )

      if (!usage) {
        return Response({
          metadata: { headers: { status: 500 } },
          data: { message: 'No resource usage founded' },
        })
      }

      const uow = UnitOfWorkSaga()

      try {
        const repository = SagaRepositoryProxy(env.repository, uow)

        // invalidar parcialmente o presigned para que outro serviço não possa utilizá-lo
        await invalidatePresignedURL({ audio })({
          repository,
        })

        if (audio.props.metadata.props.expires_at < new Date())
          throw new Error('Invalid presigned url')

        const _storage = storage({
          driver: audio.props.storage.props.type,
        })

        const buffer = await _storage.download({
          identifier: audio.props.storage.props.internal_id,
        })

        if (!buffer) {
          await uow.rollback()
          return Response({
            metadata: { headers: { status: 400 } },
            data: { message: 'Invalid audio to append' },
          })
        }

        const converted = await multimedia.convert({
          buffer,
          mime: audio.props.mime_type,
          name: audio.props.filename,
        })

        const duration = ensureDurationInSeconds(converted.duration)

        if (!checkDurationTolerance(duration, usage)) {
          uow.registerCompensation(async () => {
            await _storage.remove(audio.props.storage.props.internal_id)
          })
          await uow.rollback()
          return Response({
            metadata: { headers: { status: 400 } },
            data: { message: 'Invalid audio to append' },
          })
        }

        await updateUsage({
          usage,
          props: {
            consumption: concatenate(usage.props.consumption.props, {
              value: duration.value,
            }),
            metadata: concatenate(usage.props.metadata.props, {
              presigned_url: undefined,
              expires_at: undefined,
              confidence: undefined,
            }),
          },
        })({
          repository,
        })

        const { bucket, identifier, storage_type } = await _storage.upload({
          source: Readable.from(converted.buffer),
          metadata: {
            duration: duration.value,
            mime: converted.mime,
            name: audio.props.filename,
            owner_id: participant.meta.id,
          },
        })

        const persistedAudioResult = await persistAudio({
          audio,
          props: {
            filename: audio.props.filename,
            mime_type: converted.mime,
            duration: duration.value,
            metadata: concatenate(audio.props.metadata.props, {
              presigned_url: undefined,
              expires_at: undefined,
            }),
            storage: {
              bucket,
              internal_id: identifier,
              type: storage_type,
            },
          },
        })({ repository })

        if (isLeft(persistedAudioResult)) {
          await uow.rollback()
          return Response({
            metadata: { headers: { status: 400 } },
            data: { message: 'Invalid audio to append' },
          })
        }

        const appendMessageResult = await appendMessageToClassroom({
          classroom_id,
          participant_id: participant.meta.id,
          message_type: 'audio',
          data: {
            type: 'identifier',
            content: persistedAudioResult.value.meta.id,
          },
        })({ repository })

        if (isLeft(appendMessageResult)) {
          await uow.rollback()
          return Response({
            metadata: { headers: { status: 400 } },
            data: { message: appendMessageResult.value.message },
          })
        }

        const { message, messageOwnership } = appendMessageResult.value

        // chamar o classroom interactions guidance
        // classroomInteractionsGuidance(classroom_id)

        return Response.data({
          message: messageDTOFromGraph({
            classroom_id,
            message,
            messageOwnership,
            audio: persistedAudioResult.value,
            audioOwnership,
          }),
        })
      } catch (e) {
        await uow.rollback()
        throw e
      }
    },
)
