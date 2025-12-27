/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Right, Service } from '@davna/core'
import {
  createParticipant,
  Participant,
  ParticipantProps,
} from '../../entities'
import { ClassroomFedRepository } from '../../repositories'

interface Data {
  subject_id: string
  type: ParticipantProps['type']
}

interface Env {
  repository: ClassroomFedRepository
}

export const createParticipantForSubject = Service<Data, Env, Participant>(
  ({ subject_id, type }) =>
    async ({ repository }) => {
      const participant = await repository.methods.set(
        createParticipant({ subject_id, type }),
      )

      return Right(participant)
    },
)
