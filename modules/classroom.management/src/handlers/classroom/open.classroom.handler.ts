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
import { ClassroomFedRepository } from '../../repositories'
import { openClassroom } from '../../services/classroom/open.classroom'
import { getParticipant } from '../../services/participant/get.participant'

interface Metadata {
  account: Identifiable
  agent_participant_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

export const openClassroomHandler = Handler<Env, any, Metadata>(
  ({ metadata }) =>
    async env => {
      const { account, agent_participant_id } = metadata

      const participantResult = await getParticipant({
        participant_id: agent_participant_id,
      })({
        repository: env.repository,
      })

      if (isLeft(participantResult))
        return Response({
          metadata: { headers: { status: 400 } },
          data: { message: `Invalid agent id: ${agent_participant_id}` },
        })

      const participant = participantResult.value

      const uow = UnitOfWorkSaga()
      try {
        const repository = SagaRepositoryProxy(env.repository, uow)

        const result = await openClassroom({
          owner_id: account.id,
          participant_ids: [participant.meta.id],
        })({ repository })

        if (isLeft(result)) {
          await uow.rollback()
          return Response({
            metadata: { headers: { status: 400 } },
            data: { message: result.value.message },
          })
        }

        const { classroom } = result.value

        return Response.data({ classroom })
      } catch (e) {
        await uow.rollback()
        throw e
      }
    },
)
