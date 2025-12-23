/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Left, QueryBuilder, Right, Service } from '@davna/core'
import { ClassroomFedRepository } from '../repositories'
import {
  Classroom,
  ClassroomURI,
  createClassroom,
  createOwnership,
  createParticipation,
  Ownership,
  Participant,
  PARTICIPANT_ROLE,
  ParticipantURI,
} from '../entities'

interface Request {
  owner_id: string
  participant_ids: string[]
}

interface Env {
  repository: ClassroomFedRepository
}

interface Response {
  classroom: Classroom
  ownership: Ownership
  participants: Participant[]
}

export const openClassroom = Service<Request, Env, Response>(
  ({ owner_id, participant_ids }) =>
    async ({ repository }) => {
      const [owner, participants] = await Promise.all([
        repository.methods.get(owner_id),
        repository.methods.query(
          QueryBuilder<Participant>()
            .filterBy('id', 'in', participant_ids)
            .build(),
          ParticipantURI,
        ),
      ])

      if (!owner || owner._t !== ParticipantURI)
        return Left({
          status: 'error',
          message: 'Invalid owner id',
        })

      if (participant_ids.some(id => !participants.find(p => p.meta.id === id)))
        return Left({
          status: 'error',
          message: 'Invalid participant ids related',
        })

      const classroom = await repository.methods.set(
        createClassroom({ name: `classroom-${new Date().toISOString()}` }), // Essa política de criação de nomes pode mudar e deve ser externa
      )

      const [result, ownership] = await Promise.all([
        repository.methods.batch(
          participants.map(participant => ({
            type: 'upsert',
            data: createParticipation({
              source_id: participant.meta.id,
              target_id: classroom.meta.id,
              participant_role:
                participant.props.type === 'agent'
                  ? PARTICIPANT_ROLE.TEACHER
                  : PARTICIPANT_ROLE.STUDENT,
            }),
          })),
        ),
        repository.methods.set(
          createOwnership({
            source_id: owner_id,
            target_id: classroom.meta.id,
            target_type: ClassroomURI,
          }),
        ),
      ])

      if (result.status === 'failed')
        return Left({
          status: 'error',
          message: 'Failed to create classroom participations',
        })

      return Right({
        classroom,
        participants,
        ownership,
      })
    },
)
