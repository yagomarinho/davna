/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Right, Service } from '@davna/core'
import {
  Audio,
  AudioURI,
  createAudio,
  createOwnership,
  createUsage,
  Ownership,
  SUPPORTED_MIME_TYPE,
  Usage,
} from '../../entities'
import { ClassroomFedRepository } from '../../repositories'
import { Storage } from '@davna/infra'
import { Duration } from '@davna/kernel'

export enum CONFIDENCE {
  DETERMINISTIC = 'deterministic',
  ESTIMATED = 'estimated',
}
interface Request {
  usage_participant_id: string
  owner_id: string
  mime_type: SUPPORTED_MIME_TYPE
  duration: Duration
  confidence: CONFIDENCE
}
interface Env {
  repository: ClassroomFedRepository
  storage: Storage
}
interface Response {
  audio: Audio
  usage: Usage
  ownership: Ownership
}

export const createPresignedAudio = Service<Request, Env, Response>(
  ({ owner_id, duration, mime_type, usage_participant_id, confidence }) =>
    async ({ repository, storage }) => {
      const { url, expires_at, identifier, storage_type, bucket } =
        await storage.getSignedUrl()

      const audio = await repository.methods.set(
        createAudio({
          status: 'presigned',
          filename: `tmp-${new Date().toISOString()}`, // Política de nomes deve ser atualizada para fora do handler porque pode mudar no futuro
          mime_type,
          duration: duration.value,
          url: '',
          metadata: {
            presigned_url: url,
            expires_at,
          },
          storage: {
            bucket,
            internal_id: identifier,
            type: storage_type,
          },
        }),
      )

      const normalization_factor = 1000

      const [usage, ownership] = await Promise.all([
        repository.methods.set(
          createUsage({
            source_id: usage_participant_id,
            target_id: audio.meta.id,
            target_type: AudioURI,
            consumption: {
              unit: duration.unit,
              value: duration.value,
              raw_value: duration.value * normalization_factor,
              normalization_factor,
              precision: 0,
            },
            metadata: {
              presigned_url: url,
              expires_at,
              audio_owner_id: owner_id,
              confidence,
            },
          }),
        ),
        repository.methods.set(
          createOwnership({
            source_id: owner_id,
            target_id: audio.meta.id,
            target_type: AudioURI,
          }),
        ),
      ])

      return Right({ audio, usage, ownership })
    },
)
