/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Handler,
  Identifiable,
  isLeft,
  Response,
  SagaRepositoryProxy,
  UnitOfWorkSaga,
} from '@davna/core'

import { openClassroom } from '../services/open.classroom'
import { ClassroomFedRepository } from '../repositories'

interface Metadata {
  account: Identifiable
}

interface Env {
  repository: ClassroomFedRepository
}

export const openClassroomHandler = Handler<Env, any, Metadata>(
  ({ metadata }) =>
    async env => {
      const { account } = metadata

      const uow = UnitOfWorkSaga()
      try {
        const repository = SagaRepositoryProxy(env.repository, uow)
        const result = await openClassroom({
          owner_id: account.id,
          participant_ids: [],
        })({ repository })

        if (isLeft(result)) {
          await uow.rollback()
          return Response.metadata({ status: 'error' })
        }

        const { classroom } = result.value

        return Response.data({ classroom })
      } catch (e) {
        await uow.rollback()
        throw e
      }
    },
)
