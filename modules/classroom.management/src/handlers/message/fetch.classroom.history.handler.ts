import {
  Handler,
  Identifiable,
  isLeft,
  QueryBuilder,
  Response,
} from '@davna/core'
import { ClassroomFedRepository } from '../../repositories'
import { OccursIn, OccursInURI } from '../../entities'
import { ensureClassroomParticipation } from '../../services'

interface Data {}

interface Metadata {
  account: Identifiable
  params: {
    id: string
  }
  query?: {
    batch_size?: number
    cursor_ref?: string
  }
}

interface Env {
  repository: ClassroomFedRepository
}

export const fetchClassroomHistory = Handler<Env, Data, Metadata>(
  ({ metadata }) =>
    async ({ repository }) => {
      const { id: subject_id } = metadata.account
      const { id: classroom_id } = metadata.params
      const { batch_size = 10, cursor_ref = '0' } = metadata.query ?? {}
      // O que eu preciso fazer aqui? pegar o history

      const { data: occursIn } = await repository.methods.query(
        QueryBuilder<OccursIn>()
          .orderBy([{ property: 'created_at', direction: 'desc' }])
          .filterBy('target_id', '==', classroom_id)
          .limit(batch_size)
          .cursor(cursor_ref)
          .build(),
        OccursInURI,
      )

      return Response({
        data: {},
        metadata: {},
      })
    },
)
