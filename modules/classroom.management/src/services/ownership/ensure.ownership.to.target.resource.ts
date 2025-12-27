/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Filter, Left, QueryBuilder, Right, Service } from '@davna/core'
import {
  Audio,
  Classroom,
  Message,
  Ownership,
  OwnershipURI,
  Text,
} from '../../entities'
import { ClassroomFedRepository } from '../../repositories'

interface Data {
  owner_id: string
  target: Classroom | Audio | Message | Text
}

interface Env {
  repository: ClassroomFedRepository
}

export const ensureOwnershipToTargetResource = Service<Data, Env, Ownership>(
  ({ target, owner_id }) =>
    async ({ repository }) => {
      const {
        data: [ownership],
      } = await repository.methods.query(
        QueryBuilder<Ownership>()
          .filterBy(
            Filter.and(
              Filter.and(
                Filter.where('source_id', '==', owner_id),
                Filter.where('target_id', '==', target.meta.id),
              ),
              Filter.where('target_type', '==', target._t),
            ),
          )
          .build(),
        OwnershipURI,
      )

      return ownership
        ? Right(ownership)
        : Left({
            status: 'error',
            message: `This owner with id ${owner_id} has no authorization to handle this resource ${target._t} with id ${target.meta.id}`,
          })
    },
)
