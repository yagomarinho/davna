import { Filter, Left, QueryBuilder, Right, Service } from '@davna/core'
import { ClassroomFedRepository } from '../../repositories'
import {
  ClassroomURI,
  Participant,
  ParticipantURI,
  ParticipationURI,
} from '../../entities'

interface Data {
  subject_id: string
  classroom_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

export const ensureClassroomParticipation = Service<Data, Env, void>(
  ({ subject_id, classroom_id }) =>
    async ({ repository }) => {
      const [
        {
          data: [participant],
        },
        classroom,
      ] = await Promise.all([
        repository.methods.query(
          QueryBuilder<Participant>()
            .filterBy('subject_id', '==', subject_id)
            .build(),
          ParticipantURI,
        ),
        repository.methods.get(classroom_id),
      ])

      if (!participant)
        return Left({
          status: 'error',
          message: 'This account has no authorization to handle this resource',
        })

      if (!classroom || classroom._t !== ClassroomURI)
        return Left({
          status: 'error',
          message: 'Has no classroom to append message',
        })

      const {
        data: [participation],
      } = await repository.methods.query(
        QueryBuilder()
          .filterBy(
            Filter.and(
              Filter.where('source_id', '==', participant.meta.id),
              Filter.where('target_id', '==', classroom.meta.id),
            ),
          )
          .build(),
        ParticipationURI,
      )

      if (!participation)
        return Left({
          status: 'error',
          message: 'This account has no authorization to handle this resource',
        })

      return Right()
    },
)
