/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Handler, Identifiable, isLeft, Response } from '@davna/core'

import { ClassroomFedRepository } from '../../repositories'
import { showClassroom } from '../../services/classroom/show.classroom'
import { getParticipantBySubjectId } from '../../services/participant/get.participant.by.subject.id'
import { classroomDTOfromGraph } from '../../dtos'

interface Metadata {
  account: Identifiable
}

interface Data {
  classroom_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

export const showClassroomHandler = Handler<Env, Data, Metadata>(
  ({ data, metadata }) =>
    async ({ repository }) => {
      const { classroom_id } = data
      const { id: subject_id } = metadata.account

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
