/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Filter, Left, Repository, Right, Service } from '@davna/core'

import { Classroom } from '../entities/classroom'
import { Message } from '../entities/message'

interface Data {
  classroom: Classroom
}

interface Env {
  classrooms: Repository<Classroom>
  messages: Repository<Message>
}

interface Response {
  consume: number
}

export const verifyConsume = Service<Data, Env, Response>(
  ({ classroom }) =>
    async ({ classrooms, messages }) => {
      const { owner_id } = classroom

      const actualDay = new Date(new Date().toDateString())
      const classes = await classrooms.query({
        where: Filter.and(
          Filter.where('owner_id', '==', owner_id),
          Filter.where('updated_at', '>=', actualDay),
        ),
      })

      const histories = classes.flatMap(c => c.history)
      const msgs = await messages.query({
        where: Filter.where('id', 'in', histories),
      })

      const actuals = msgs.filter(msg => msg.created_at >= actualDay)

      const consume = actuals
        .map(msg => msg.data.duration)
        .reduce((val, curr) => val + curr, 0)

      if (consume >= 60 * 60 * 1000 /* 1h */)
        return Left({
          status: 'error',
          message: "This user can't consume more today",
        })

      return Right({
        consume,
      })
    },
)
