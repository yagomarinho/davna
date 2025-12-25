import {
  Handler,
  Response,
  SagaRepositoryProxy,
  UnitOfWorkSaga,
} from '@davna/core'
import { ClassroomFedRepository } from '../repositories'

interface Data {}

interface Metadata {}

interface Env {
  repository: ClassroomFedRepository
}

export const storeDerivedContents = Handler<Env, Data, Metadata>(
  request => async env => {
    const uow = UnitOfWorkSaga()
    try {
      const repository = SagaRepositoryProxy(env.repository, uow)

      // O que eu tenho que fazer aqui no store derived contents?

      const a = {
        id: '',
        owner: {
          // owner props
        },
        source: {
          type: 'audio',
          data: {
            // audio content
            contents: [{ type: 'transcription', data: {} }],
          },
        },
        contents: [{ type: 'summary', data: { content: '', metadata: {} } }],
      }

      return Response.data({})
    } catch (e) {
      await uow.rollback()
      throw e
    }
  },
)
