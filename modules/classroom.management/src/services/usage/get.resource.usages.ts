/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Left, QueryBuilder, Right, Service } from '@davna/core'

import { Usage, UsageURI } from '../../entities'
import { ClassroomFedRepository } from '../../repositories'

interface Data {
  resource_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

export const getResourceUsages = Service<Data, Env, Usage[]>(
  ({ resource_id }) =>
    async ({ repository }) => {
      const { data: usages } = await repository.methods.query(
        QueryBuilder<Usage>().filterBy('target_id', '==', resource_id).build(),
        UsageURI,
      )

      if (!usages.length)
        return Left({ status: 'error', message: 'Usage not founded' })

      return Right(usages)
    },
)
