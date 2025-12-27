/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Left, Right, Service } from '@davna/core'
import { Participant, ParticipantURI } from '../../entities'
import { ClassroomFedRepository } from '../../repositories'

interface Data {
  participant_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

export const getParticipant = Service<Data, Env, Participant>(
  ({ participant_id }) =>
    async ({ repository }) => {
      const participant = await repository.methods.get(participant_id)

      return participant && participant._t === ParticipantURI
        ? Right(participant)
        : Left({ status: 'error', message: 'Participant not found' })
    },
)
