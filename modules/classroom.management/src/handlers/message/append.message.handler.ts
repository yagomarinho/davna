/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Filter,
  Handler,
  Identifiable,
  isLeft,
  QueryBuilder,
  Response,
  SagaRepositoryProxy,
  UnitOfWorkSaga,
} from '@davna/core'
import { ClassroomFedRepository } from '../repositories'
import { AudioDTO, messageDTOFromGraph } from '../dtos'
import {
  Audio,
  AudioURI,
  ClassroomURI,
  createAudio,
  createMessage,
  createOccursIn,
  createOwnership,
  createSource,
  Ownership,
  OwnershipURI,
  Participant,
  ParticipantURI,
} from '../entities'
import { MultimediaProvider } from '../providers'
import { StorageConstructor } from '../utils'
import { Readable } from 'node:stream'
import { concatenate } from '@davna/kernel'
import { ensureClassroomParticipation } from '../services/ensure.classroom.participation'
import { getAudio } from '../services/audio/get.audio'

interface Data {
  classroom_id: string
  resource: AudioDTO // | TextDTO (future implementation)
}

interface Metadata {
  account: Identifiable
}

interface Env {
  repository: ClassroomFedRepository
  multimedia: MultimediaProvider
  storage: StorageConstructor
}

export const appendMessageHandler = Handler<Env, Data, Metadata>(
  ({ data, metadata }) =>
    async env => {
      // Declarar que toda a transação é idempotente antes de tudo
      // env.entityContext.setIdempotency(metadata.idempotency_key)
      // Esse padrão de entity.setIdempotency será realizado por um middleware
      // antes de chamar o handler

      const { multimedia, storage } = env
      const {
        resource: {
          id: audio_id,
          metadata: { presigned_url },
        },
        classroom_id,
      } = data

      const owner_id = metadata.account.id

      const ensureParticipation = await ensureClassroomParticipation({
        classroom_id,
        subject_id: owner_id,
      })({ repository: env.repository })

      if (isLeft(ensureParticipation))
        return Response({
          metadata: { headers: { status: 401 } },
          data: { message: ensureParticipation.value.message },
        })

      const audioResult = await getAudio({ audio_id })({
        repository: env.repository,
      })

      if (
        isLeft(audioResult) ||
        audioResult.value.props.metadata.props.presigned_url !== presigned_url
      )
        return Response({
          metadata: { header: { status: 400 } },
          data: { message: 'Invalid audio to append' },
        })

      const uow = UnitOfWorkSaga()
      const audio = audioResult.value

      try {
        const repository = SagaRepositoryProxy(env.repository, uow)
        // invalidar parcialmente o presigned para que outro serviço não possa utilizá-lo
        await repository.methods.set(
          createAudio(
            concatenate(audio.props, {
              storage: audio.props.storage.props,
              metadata: concatenate(audio.props.metadata.props, {
                presigned_url: undefined,
                expires_at: undefined,
              }),
            }),
            audio.meta,
          ),
        )

        if (audio.props.metadata.props.expires_at < new Date())
          throw new Error('Invalid presigned url')

        const {
          data: [audioOwnership],
        } = await env.repository.methods.query(
          QueryBuilder<Ownership>()
            .filterBy(
              Filter.and(
                Filter.where('source_id', '==', participant.meta.id),
                Filter.where('target_id', '==', audio.meta.id),
              ),
            )
            .build(),
          OwnershipURI,
        )

        if (!audioOwnership)
          return Response({
            metadata: { header: { status: 401 } },
            data: {
              message:
                'This account has no authorization to handle this resource',
            },
          })

        const _storage = storage({
          driver: audio.props.storage.props.type,
        })

        const buffer = await _storage.download({
          identifier: audio.props.storage.props.internal_id,
        })

        if (!buffer)
          return Response({
            metadata: { header: { status: 400 } },
            data: { message: 'Invalid audio to append' },
          })

        const converted = await multimedia.convert({
          buffer,
          mime: audio.props.mime_type,
          name: audio.props.filename,
        })

        const { bucket, identifier, storage_type } = await _storage.upload({
          source: Readable.from(converted.buffer),
          metadata: {
            duration: converted.duration,
            mime: converted.mime,
            name: audio.props.filename,
            owner_id: participant.meta.id,
          },
        })

        const [updatedAudio, message] = await Promise.all([
          repository.methods.set<Audio>(
            createAudio(
              {
                status: 'persistent',
                filename: audio.props.filename,
                mime_type: converted.mime,
                duration: converted.duration,
                url: `${process.env.API_BASE_URL}/audio/${audio.meta.id}`, // Tornar essa geração de nome externa
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
              audio.meta,
            ),
          ),
          repository.methods.set(createMessage()),
        ])

        const [messageOwnership] = await Promise.all([
          repository.methods.set(
            createOwnership({
              source_id: participant.meta.id,
              target_id: message.meta.id,
              target_type: 'message',
            }),
          ),
          repository.methods.set(
            createSource({
              source_id: updatedAudio.meta.id,
              target_id: message.meta.id,
              source_type: AudioURI,
            }),
          ),
          repository.methods.set(
            createOccursIn({
              source_id: message.meta.id,
              target_id: classroom_id,
            }),
          ),
        ])

        // chamar o classroom interactions guidance
        // classroomInteractionsGuidance(classroom_id)

        return Response.data({
          message: messageDTOFromGraph({
            classroom_id,
            message,
            messageOwnership,
            audio: updatedAudio,
            audioOwnership,
          }),
        })
      } catch (e) {
        await uow.rollback()
        throw e
      }
    },
)
