/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Left, Query, Repository, Right, Service } from '@davna/core'

import { Classroom } from '../entities/classroom'
import { Message } from '../entities/message'

interface Request {
  participant_id: string
  classroom_id: string
}

interface Env {
  classrooms: Repository<Classroom>
  messages: Repository<Message>
}

interface Response {
  classroom: Omit<Classroom, 'history'> & { history: Message[] }
}

export const showClassroom = Service<Request, Env, Response>(
  ({ classroom_id, participant_id }) =>
    async ({ classrooms, messages }) => {
      const classroom = await classrooms.get(classroom_id)

      if (!classroom)
        return Left({
          status: 'error',
          message: 'Classroom not founded',
        })

      if (
        !classroom.participants.find(p => p.participant_id === participant_id)
      )
        return Left({
          status: 'error',
          message: 'Not authorized to get this classroom',
        })

      return Right({
        classroom: {
          ...classroom,
          history: await messages.query(
            Query.where('id', 'in', classroom.history),
          ),
        },
      })
    },
)
