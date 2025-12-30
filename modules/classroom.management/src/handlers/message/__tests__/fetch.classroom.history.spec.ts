import {
  Request,
  Left,
  Right,
  createMeta,
  createAuthContext,
} from '@davna/core'

import { ClassroomFedRepository } from '../../../repositories'
import { fetchClassroomHistoryHandler } from '../fetch.classroom.history.handler'

import {
  createParticipant,
  createMessage,
  createOccursIn,
  createSource,
  createAudio,
  createText,
  createRepresentation,
  AUDIO_STATUS,
  REPRESENTATION_KIND,
  REPRESENTATION_TYPE,
} from '../../../entities'

import {
  getParticipantBySubjectId,
  ensureClassroomParticipation,
} from '../../../services'
import { ClassroomFedFake } from '../../../services/__fakes__/classroom.fed.fake'
import { STORAGE_TYPE } from '@davna/infra'

jest.mock('../../../services')

describe('fetch classroom history handler', () => {
  let repository: ClassroomFedRepository

  beforeEach(() => {
    repository = ClassroomFedFake()
    jest.clearAllMocks()
  })

  function request(overrides?: Partial<any>) {
    return Request.metadata({
      auth: createAuthContext(
        { id: 'account-1' },
        { type: 'agent', subject_id: 'agent-1' },
      ),
      params: { id: 'classroom-1' },
      ...overrides,
    })
  }

  function entityMeta(id: string) {
    const now = new Date()
    return createMeta({
      id,
      created_at: now,
      updated_at: now,
      _idempotency_key: '',
    })
  }

  it('should return 400 when participant is invalid', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Left({ message: 'invalid participant' })),
    )

    const result = await fetchClassroomHistoryHandler(request())({
      repository,
    })

    expect(result.metadata?.headers?.status).toBe(400)
    expect(result.data).toEqual({
      message: 'invalid participant',
    })
  })

  it('should return 401 when participant is not part of classroom', async () => {
    const participant = createParticipant(
      { subject_id: 'agent-1', type: 'agent' },
      entityMeta('participant-1'),
    )

    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Left({ message: 'not allowed' })),
    )

    const result = await fetchClassroomHistoryHandler(request())({
      repository,
    })

    expect(result.metadata?.headers?.status).toBe(401)
    expect(result.data).toEqual({
      message: 'not allowed',
    })
  })

  it('should return classroom history with audio and text messages', async () => {
    const participant = createParticipant(
      { subject_id: 'agent-1', type: 'agent' },
      entityMeta('participant-1'),
    )

    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(true)),
    )

    const message1 = await repository.methods.set(createMessage({}))
    const message2 = await repository.methods.set(createMessage({}))

    await repository.methods.set(
      createOccursIn({
        source_id: message1.meta.id,
        target_id: 'classroom-1',
      }),
    )

    await repository.methods.set(
      createOccursIn({
        source_id: message2.meta.id,
        target_id: 'classroom-1',
      }),
    )

    const audio = await repository.methods.set(
      createAudio({
        filename: 'audio.mp3',
        mime_type: 'audio/mpeg',
        duration: 10,
        url: 'url',
        metadata: {},
        status: AUDIO_STATUS.PERSISTENT,
        storage: {
          bucket: 'bucket',
          internal_id: 'internal_id',
          type: STORAGE_TYPE.AWS_S3,
        },
      }),
    )

    await repository.methods.set(
      createSource({
        source_id: audio.meta.id,
        source_type: 'audio',
        target_id: message1.meta.id,
      }),
    )

    const audioText = await repository.methods.set(
      createText({ content: 'transcription', metadata: {} }),
    )

    await repository.methods.set(
      createRepresentation({
        kind: REPRESENTATION_KIND.TRANSFORMATION,
        type: REPRESENTATION_TYPE.TRANSCRIPTION,
        target_type: 'audio',
        target_id: audio.meta.id,
        source_id: audioText.meta.id,
      }),
    )

    const text = await repository.methods.set(
      createText({ content: 'hello', metadata: {} }),
    )

    await repository.methods.set(
      createSource({
        source_id: text.meta.id,
        source_type: 'text',
        target_id: message2.meta.id,
      }),
    )

    const result = await fetchClassroomHistoryHandler(
      request({ query: { batch_size: 10 } }),
    )({ repository })

    expect(result.data.history).toHaveLength(2)

    expect(result.data.history[0]).toEqual(
      expect.objectContaining({
        source: expect.objectContaining({
          type: 'audio',
          data: expect.objectContaining({
            contents: expect.arrayContaining([
              expect.objectContaining({
                type: 'transcription',
              }),
            ]),
          }),
        }),
      }),
    )

    expect(result.data.history[1]).toEqual(
      expect.objectContaining({
        source: expect.objectContaining({
          type: 'text',
          data: expect.objectContaining({
            content: 'hello',
          }),
        }),
      }),
    )
  })
})
