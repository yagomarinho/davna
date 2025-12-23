/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Filter, Left, QueryBuilder, Right, Service } from '@davna/core'
import { ClassroomFedRepository } from '../repositories'
import {
  Audio,
  Classroom,
  ClassroomURI,
  Message,
  OccursIn,
  OccursInURI,
  Ownership,
  OwnershipURI,
  Participant,
  ParticipantURI,
  Participation,
  ParticipationURI,
  Representation,
  Source,
  Text,
} from '../entities'

interface Request {
  participant_id: string
  classroom_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

interface Response {
  classroom: Classroom
  classroom_ownership: Ownership
  occursIn: OccursIn[]
  messages: Message[]
  messages_ownerships: Ownership[]
  participants: Participant[]
  participations: Participation[]
  sources: Source[]
  audios: Audio[]
  texts: Text[]
  representations: Representation[]
}

export const showClassroom = Service<Request, Env, Response>(
  ({ classroom_id, participant_id }) =>
    async ({ repository }) => {
      const classroom = await repository.methods.get(classroom_id)

      if (!classroom || !classroom_id)
        return Left({
          status: 'error',
          message: 'Classroom not founded',
        })

      const participations = await repository.methods.query(
        QueryBuilder().filterBy('target_id', '==', classroom_id).build(),
        ParticipationURI,
      )

      if (!participations.find(p => p.props.source_id === participant_id))
        return Left({
          status: 'error',
          message: 'Not authorized to show this classroom',
        })

      const [classroom_ownership, occursIn, participants] = await Promise.all([
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
          QueryBuilder().filterBy('target_id', '==', classroom.meta.id).build(),
          OccursInURI,
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

      const [messages] = await Promise.all([
        repository.methods.query(QueryBuilder().orderBy().filterBy().build()),
      ])

      return Right({
        classroom,
        classroom_ownership,
        occursIn,
        messages,
        messages_ownerships,
        participants,
        participations,
        sources,
        audios,
        texts,
        representations,
      })
    },
)
