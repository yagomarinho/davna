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

import { ClassroomFedRepository } from '../../repositories'
import {
  createOwnership,
  createRepresentation,
  createText,
  createUsage,
  TextURI,
  USAGE_STATUS,
} from '../../entities'

import { getParticipantBySubjectId } from '../../services'
import { DerivedContent } from '../../dtos'

interface Data {
  contents: DerivedContent[]
}

interface Metadata {
  auth: AuthContext
}

interface Env {
  repository: ClassroomFedRepository
}

export const storeDerivedContentsHandler = Handler<Env, Data, Metadata>(
  ({ data, metadata }) =>
    async env => {
      const {
        actor: { subject_id },
        principal: {
          account: { id: account_id },
        },
      } = metadata.auth
      const { contents } = data

      const accountParticipantResult = await getParticipantBySubjectId({
        subject_id: account_id,
      })({ repository: env.repository })

      const actorParticipantResult = await getParticipantBySubjectId({
        subject_id,
      })({ repository: env.repository })

      if (isLeft(accountParticipantResult) || isLeft(actorParticipantResult))
        return Response({
          metadata: { headers: { status: 401 } },
          data: { message: 'Invalid account id' },
        })

      const account_participant = accountParticipantResult.value
      const actor_participant = actorParticipantResult.value

      const uow = UnitOfWorkSaga()
      try {
        const repository = SagaRepositoryProxy(env.repository, uow)

        await Promise.all(
          contents.map(
            async ({
              kind,
              type,
              target_id,
              target_type,
              content,
              metadata,
              consumption,
            }) => {
              const text = await repository.methods.set(
                createText({ content, metadata }),
              )

              await Promise.all([
                repository.methods.set(
                  createOwnership({
                    source_id: actor_participant.meta.id,
                    target_id: text.meta.id,
                    target_type: TextURI,
                  }),
                ),
                repository.methods.set(
                  createRepresentation({
                    kind,
                    type,
                    target_type,
                    target_id,
                    source_id: text.meta.id,
                  }),
                ),
                repository.methods.set(
                  createUsage({
                    status: USAGE_STATUS.CONFIRMED,
                    target_type: TextURI,
                    target_id: text.meta.id,
                    source_id: account_participant.meta.id,
                    consumption: {
                      unit: consumption.unit,
                      value: consumption.value,
                      raw_value: consumption.raw_value,
                      normalization_factor: consumption.normalization_factor,
                      precision: consumption.precision,
                    },
                    metadata: {
                      text_owner_id: actor_participant.meta.id,
                    },
                  }),
                ),
              ])
            },
          ),
        )

        return Response({
          metadata: { headers: { status: 203 } },
          data: { message: 'Accepted' },
        })
      } catch (e) {
        await uow.rollback()
        throw e
      }
    },
)
