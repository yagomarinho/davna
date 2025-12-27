/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Filter, Left, QueryBuilder, Right, Service } from '@davna/core'
import { ClassroomFedRepository } from '../../repositories'
import { ClassroomURI, ParticipationURI } from '../../entities'

interface Data {
  participant_id: string
  classroom_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

export const ensureClassroomParticipation = Service<Data, Env, void>(
  ({ participant_id, classroom_id }) =>
    async ({ repository }) => {
      const [
        participant,
        classroom,
        {
          data: [participation],
        },
      ] = await Promise.all([
        repository.methods.get(participant_id),
        repository.methods.get(classroom_id),
        repository.methods.query(
          QueryBuilder()
            .filterBy(
              Filter.and(
                Filter.where('source_id', '==', participant_id),
                Filter.where('target_id', '==', classroom_id),
              ),
            )
            .build(),
          ParticipationURI,
        ),
      ])

      if (!participant)
        return Left({
          status: 'error',
          message: 'This account has no authorization to handle this resource',
        })

      if (!classroom || classroom._t !== ClassroomURI)
        return Left({
          status: 'error',
          message: 'Has no classroom to append message',
        })

      if (!participation)
        return Left({
          status: 'error',
          message: 'This account has no authorization to handle this resource',
        })

      return Right()
    },
)
