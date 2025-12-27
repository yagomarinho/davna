import { Left, QueryBuilder, Right, Service } from '@davna/core'
import { Participant, ParticipantURI } from '../../entities'
import { ClassroomFedRepository } from '../../repositories'

interface Data {
  subject_id: string
}

interface Env {
  repository: ClassroomFedRepository
}

export const getParticipantBySubjectId = Service<Data, Env, Participant>(
  ({ subject_id }) =>
    async ({ repository }) => {
      const {
        data: [participant],
      } = await repository.methods.query(
        QueryBuilder().filterBy('subject_id', '==', subject_id).build(),
        ParticipantURI,
      )

      return participant
        ? Right(participant)
        : Left({ status: 'error', message: 'Participant not found' })
    },
)
