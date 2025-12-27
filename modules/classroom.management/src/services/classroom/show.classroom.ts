/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Filter, Left, QueryBuilder, Right, Service } from '@davna/core'
import { ClassroomFedRepository } from '../../repositories'
import {
  Classroom,
  ClassroomURI,
  Ownership,
  OwnershipURI,
  Participant,
  ParticipantURI,
  Participation,
  ParticipationURI,
} from '../../entities'

interface Request {
  participant_id: string
  classroom_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

interface Response {
  classroom: Classroom
  classroomOwnership: Ownership
  participants: Participant[]
  participations: Participation[]
}

export const showClassroom = Service<Request, Env, Response>(
  ({ classroom_id, participant_id }) =>
    async ({ repository }) => {
      const classroom = await repository.methods.get(classroom_id)

      if (!classroom || classroom._t !== ClassroomURI)
        return Left({
          status: 'error',
          message: 'Classroom not founded',
        })

      const { data: participations } = await repository.methods.query(
        QueryBuilder().filterBy('target_id', '==', classroom_id).build(),
        ParticipationURI,
      )

      if (!participations.find(p => p.props.source_id === participant_id))
        return Left({
          status: 'error',
          message: 'Not authorized to show this classroom',
        })

      const [
        {
          data: [classroomOwnership],
        },
        { data: participants },
      ] = await Promise.all([
        repository.methods.query(
          QueryBuilder()
            .filterBy(
              Filter.and(
                Filter.where('target_id', '==', classroom.meta.id),
                Filter.where('target_type', '==', ClassroomURI),
              ),
            )
            .build(),
          OwnershipURI,
        ),
        repository.methods.query(
          QueryBuilder()
            .filterBy(
              'id',
              'in',
              participations.map(p => p.props.source_id),
            )
            .build(),
          ParticipantURI,
        ),
      ])

      return Right({
        classroom,
        classroomOwnership,
        participants,
        participations,
      })
    },
)
