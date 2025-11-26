import { Right } from '../../../shared/core/either'
import { Repository } from '../../../shared/core/repository'
import { Service } from '../../../shared/core/service'
import { Classroom, PARTICIPANT_ROLE } from '../entities/classroom'

interface Request {
  participant_id: string
}

interface Env {
  classrooms: Repository<Classroom>
}

export const openClassroom = Service<Request, Env, Classroom>(
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

      return Right(classroom)
    },
)
