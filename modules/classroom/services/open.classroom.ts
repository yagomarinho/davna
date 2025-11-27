import { isLeft, Right } from '../../../shared/core/either'
import { Repository } from '../../../shared/core/repository'
import { Service } from '../../../shared/core/service'
import { Classroom, PARTICIPANT_ROLE } from '../entities/classroom'
import { Message } from '../entities/message'
import { verifyConsume } from './verify.consume'

interface Request {
  participant_id: string
}

interface Env {
  classrooms: Repository<Classroom>
  messages: Repository<Message>
}

interface Response {
  classroom: Classroom
  consume: number
}

export const openClassroom = Service<Request, Env, Response>(
  ({ participant_id }) =>
    async ({ classrooms, messages }) => {
      let classroom = Classroom.create({
        owner_id: participant_id,
        participants: [
          {
            participant_id: 'agent',
            role: PARTICIPANT_ROLE.TEACHER,
          },
          {
            participant_id,
            role: PARTICIPANT_ROLE.STUDENT,
          },
        ],
        history: [],
      })

      classroom = await classrooms.set(classroom)

      const result = await verifyConsume({ classroom })({
        classrooms,
        messages,
      })

      if (isLeft(result)) return result

      return Right({
        consume: result.value.consume,
        classroom,
      })
    },
)
