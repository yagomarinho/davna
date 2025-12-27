/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Left, QueryBuilder, Right, Service } from '@davna/core'
import { Participant, ParticipantURI } from '../../entities'
import { ClassroomFedRepository } from '../../repositories'

interface Data {
  subject_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

export const getParticipantBySubjectId = Service<Data, Env, Participant>(
  ({ subject_id }) =>
    async ({ repository }) => {
      const {
        data: [participant],
      } = await repository.methods.query(
        QueryBuilder().filterBy('subject_id', '==', subject_id).build(),
        ParticipantURI,
      )

      return participant
        ? Right(participant)
        : Left({ status: 'error', message: 'Participant not found' })
    },
)
