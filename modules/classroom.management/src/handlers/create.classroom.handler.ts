/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Handler, Identifier, isLeft, Repository, Response } from '@davna/core'

import { Classroom } from '../entities'

import { createClassroom } from '../services/open.classroom'

interface Metadata {
  account: Identifier
}

interface Env {
  classrooms: Repository<Classroom>
}

export const createClassroomHandler = Handler<Env, any, Metadata>(
  ({ metadata }) =>
    async ({ classrooms }) => {
      const { account } = metadata

      const result = await createClassroom({
        participant_id: account.id,
      })({ classrooms })

      if (isLeft(result)) {
        return Response.metadata({ status: 'error' })
      }

      const { classroom } = result.value

      return Response.data({ classroom })
    },
)
