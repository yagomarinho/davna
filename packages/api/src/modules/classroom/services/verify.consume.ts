import { Left, Right } from '../../../shared/core/either'
import { Filter, Repository } from '../../../shared/core/repository'
import { Service } from '../../../shared/core/service'
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
      // 1. pego o dona da sala
      const { owner_id } = classroom

      // 2. verifico quantas classroom ele tem que tiveram updated_at superior ao dia atual
      const actualDay = new Date(new Date().toDateString())
      const classes = await classrooms.query({
        where: Filter.and(
          Filter.where('owner_id', '==', owner_id),
          Filter.where('updated_at', '>=', actualDay),
        ),
      })

      // 3. pego todas as mensagem dessa sala de aula que seja superiores ao updated_at do dia atual
      const histories = classes.flatMap(c => c.history)
      const msgs = await messages.query({
        where: Filter.where('id', 'in', histories),
      })
      const actuals = msgs.filter(msg => msg.created_at >= actualDay)

      // 4. somo todas as durações e comparo pra saber se é superior a 1h
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
