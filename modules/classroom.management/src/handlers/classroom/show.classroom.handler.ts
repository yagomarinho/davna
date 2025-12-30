/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AuthContext, Handler, isLeft, Response } from '@davna/core'

import { ClassroomFedRepository } from '../../repositories'
import { showClassroom, getParticipantBySubjectId } from '../../services'
import { classroomDTOfromGraph } from '../../dtos'

interface Metadata {
  params: { id: string }
  auth: AuthContext
}

interface Env {
  repository: ClassroomFedRepository
}

export const showClassroomHandler = Handler<Env, any, Metadata>(
  ({ metadata }) =>
    async ({ repository }) => {
      const {
        params: { id: classroom_id },
        auth: {
          actor: { subject_id },
        },
      } = metadata

      const getParticipantResult = await getParticipantBySubjectId({
        subject_id,
      })({ repository })

      if (isLeft(getParticipantResult))
        return Response({
          metadata: { headers: { status: 400 } },
          data: { message: getParticipantResult.value.message },
        })

      const showClassroomResult = await showClassroom({
        classroom_id,
        participant_id: getParticipantResult.value.meta.id,
      })({ repository })

      if (isLeft(showClassroomResult))
        return Response({
          metadata: { headers: { status: 400 } },
          data: { message: showClassroomResult.value.message },
        })

      const { classroom, classroomOwnership, participations } =
        showClassroomResult.value

      return Response.data({
        classroom: classroomDTOfromGraph({
          classroom,
          classroomOwnership,
          participations,
        }),
      })
    },
)
