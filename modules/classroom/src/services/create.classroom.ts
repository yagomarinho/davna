import { Repository, Right, Service } from '@davna/core'

import { Classroom, PARTICIPANT_ROLE } from '../entities/classroom'

interface Request {
  participant_id: string
}

interface Env {
  classrooms: Repository<Classroom>
}

interface Response {
  classroom: Classroom
}

export const createClassroom = Service<Request, Env, Response>(
  ({ participant_id }) =>
    async ({ classrooms }) => {
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

      return Right({
        classroom,
      })
    },
)
