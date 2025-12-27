import { fetchUnprocessedMessages } from '../../message/fetch.unprocessed.messages'
import { isRight, QueryBuilder } from '@davna/core'
import { ClassroomFedRepository } from '../../../repositories'
import {
  AudioURI,
  ClassroomURI,
  createRepresentation,
  createText,
  REPRESENTATION_TYPE,
} from '../../../entities'
import {
  ClassroomFedFake,
  fillRepository,
} from '../../__fakes__/classroom.fed.fake'

describe('fetch unprocessed messages service', () => {
  let repo: ClassroomFedRepository

  beforeAll(async () => {
    repo = ClassroomFedFake()

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

    const { data: audios } = await repo.methods.query(
      QueryBuilder().build(),
      AudioURI,
    )

    const audio2 = audios.find(audio => audio.props.filename === 'audio2')!
    expect(audio2).toBeDefined()

    await repo.methods.set(
      createRepresentation({
        target_type: AudioURI,
        target_id: audio2.meta.id,
        source_id: (
          await repo.methods.set(
            createText({
              content: 'This is translation of audio2',
              metadata: {},
            }),
          )
        ).meta.id,
        type: REPRESENTATION_TYPE.TRANSLATION,
      }),
    )
    const result = await fetchUnprocessedMessages({
      classroom_id,
    })({ repository: repo })

    const { unprocessed_messages, next_cursor } = result.value as any

    expect(next_cursor).toBeUndefined()
    expect(unprocessed_messages.length).toBe(0)
  })
})
