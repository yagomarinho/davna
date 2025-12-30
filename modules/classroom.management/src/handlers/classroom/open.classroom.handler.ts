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
import { openClassroom, getParticipantBySubjectId } from '../../services'

interface Metadata {
  auth: AuthContext
}

interface Data {
  agent_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

export const openClassroomHandler = Handler<Env, Data, Metadata>(
  ({ data, metadata }) =>
    async env => {
      const {
        actor: { subject_id },
      } = metadata.auth
      const { agent_id } = data

      const participantResult = await getParticipantBySubjectId({
        subject_id: agent_id,
      })({
        repository: env.repository,
      })

      if (isLeft(participantResult))
        return Response({
          metadata: { headers: { status: 400 } },
          data: { message: `Invalid agent id: ${agent_id}` },
        })

      const participant = participantResult.value

      const uow = UnitOfWorkSaga()
      try {
        const repository = SagaRepositoryProxy(env.repository, uow)

        const result = await openClassroom({
          owner_id: subject_id,
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
