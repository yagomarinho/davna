import { IDContext } from '@davna/infra'
import { fetchUnprocessedMessages } from '../../message/fetch.unprocessed.messages'
import { isRight, QueryBuilder } from '@davna/core'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomURI } from '../../../entities'
import { ClassroomFedFake, fillRepository } from './fakes/classroom.fed.fake'

describe('fetch unprocessed messages service', () => {
  let repo: ClassroomFedRepository

  const IDContext = {
    getIDEntity: jest.fn(),
    declareEntity: jest.fn(),
    createMeta: jest.fn(),
    getEntityTag: jest.fn(),
    setIdempotency: jest.fn(),
    validateEntity: jest.fn(),
  } as any as jest.Mocked<IDContext>

  beforeAll(async () => {
    repo = ClassroomFedFake({ IDContext })

    await fillRepository(repo)

    jest.clearAllMocks()
  })

  it('should be able to return only messages whose audios are not fully processed', async () => {
    const {
      data: [classroom],
    } = await repo.methods.query(QueryBuilder().build(), ClassroomURI)

    const result = await fetchUnprocessedMessages({
      classroom_id: classroom.meta.id,
      batch_size: 10,
    })({ repository: repo })

    expect(isRight(result)).toBeTruthy()

    const { unprocessed_messages, next_cursor } = result.value as any

    expect(next_cursor).toBeUndefined()
    expect(unprocessed_messages.length).toBe(1)
  })

  it('should be able to return an empty list when all audios are already processed', async () => {
    const classroom_id = 'classroom-1'

    repo.methods.set()

    const result = await fetchUnprocessedMessages({
      classroom_id,
    })({ repository: repo })

    const { unprocessed_messages, next_cursor } = result.value as any

    expect(next_cursor).toBeUndefined()
    expect(unprocessed_messages.length).toBe(0)
  })
})
