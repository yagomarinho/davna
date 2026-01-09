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

import { getParticipantBySubjectId, storeDerivedContents } from '../../services'
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

        const storeResult = await storeDerivedContents({
          contents,
          owner_id: actor_participant.meta.id,
          usage_participant_id: account_participant.meta.id,
        })({ repository })

        if (isLeft(storeResult))
          return Response({
            metadata: { headers: { status: 500 } },
            data: { message: 'Internal server error' },
          })

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
