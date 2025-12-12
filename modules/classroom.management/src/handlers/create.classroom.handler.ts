import { Handler, Identifier, isLeft, Repository, Response } from '@davna/core'

import { Classroom } from '../entities'

import { createClassroom } from '../services/create.classroom'

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
