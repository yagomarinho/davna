import { createMeta, Left, Request, Right } from '@davna/core'
import { fetchClassroomHistoryHandler } from '../fetch.classroom.history.handler'
import { ensureClassroomParticipation } from '../../../services'
import {
  createAudio,
  createMessage,
  createRepresentation,
  createSource,
  createText,
  REPRESENTATION_TYPE,
} from '../../../entities'

jest.mock('../../../services')

describe('fetch classroom history handler', () => {
  const repository = {
    methods: {
      query: jest.fn(),
      get: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when participant is not part of classroom', async () => {
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'Not allowed',
        }),
      ),
    )

    const result = await fetchClassroomHistoryHandler(
      Request.data({
        classroom_id: 'classroom-1',
        participant_id: 'participant-1',
      }),
    )({ repository } as any)

    expect(result.metadata?.headers?.status).toBe(401)
    expect(result.data).toEqual({
      message: 'Not allowed',
    })
  })

  it('should return classroom history with audio message', async () => {
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(true)),
    )

    const message = createMessage(
      {},
      createMeta({
        id: 'message-1',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      }),
    )
    const audio = createAudio(
      {
        status: 'persistent',
        filename: 'audio.mp3',
        mime_type: 'audio/mpeg',
        duration: 10,
        url: 'url',
        metadata: {},
        storage: {} as any,
      },
      createMeta({
        id: 'audio-1',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      }),
    )

    const occursIn = {
      props: { source_id: message.meta.id },
    }

    const source = createSource({
      source_type: 'audio',
      source_id: audio.meta.id,
      target_id: message.meta.id,
    })

    const representation = createRepresentation({
      source_id: 'text-1',
      target_id: audio.meta.id,
      target_type: 'audio',
      type: REPRESENTATION_TYPE.TRANSCRIPTION,
    })

    repository.methods.query
      // OccursIn
      .mockResolvedValueOnce({ data: [occursIn] })
      // Messages
      .mockResolvedValueOnce({ data: [message] })
      // Source
      .mockResolvedValueOnce({ data: [source] })
      // Representation
      .mockResolvedValueOnce({ data: [representation] })

    repository.methods.get
      // audio
      .mockResolvedValueOnce(audio)
      // representation content
      .mockResolvedValueOnce({ content: 'hello' })

    const result = await fetchClassroomHistoryHandler(
      Request.data({
        classroom_id: 'classroom-1',
        participant_id: 'participant-1',
      }),
    )({ repository } as any)

    expect(result.data).toEqual(
      expect.objectContaining({
        history: [
          expect.objectContaining({
            id: message.meta.id,
            source: expect.objectContaining({
              type: 'audio',
              data: expect.objectContaining({
                id: audio.meta.id,
                filename: 'audio.mp3',
                contents: [
                  expect.objectContaining({
                    type: REPRESENTATION_TYPE.TRANSCRIPTION,
                  }),
                ],
              }),
            }),
          }),
        ],
      }),
    )
  })

  it('should return classroom history with text message', async () => {
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(true)),
    )

    const message = createMessage(
      {},
      createMeta({
        id: 'message-1',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      }),
    )
    const text = createText(
      {
        content: 'hello world',
        metadata: {},
      },
      createMeta({
        id: 'text-1',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      }),
    )

    const occursIn = {
      props: { source_id: message.meta.id },
    }

    const source = createSource({
      source_type: 'text',
      source_id: text.meta.id,
      target_id: message.meta.id,
    })

    repository.methods.query
      // OccursIn
      .mockResolvedValueOnce({ data: [occursIn] })
      // Messages
      .mockResolvedValueOnce({ data: [message] })
      // Source
      .mockResolvedValueOnce({ data: [source] })
      // Representation (empty)
      .mockResolvedValueOnce({ data: [] })

    repository.methods.get.mockResolvedValueOnce(text)

    const result = await fetchClassroomHistoryHandler(
      Request.data({
        classroom_id: 'classroom-1',
        participant_id: 'participant-1',
      }),
    )({ repository } as any)

    expect(result.data).toEqual(
      expect.objectContaining({
        history: [
          expect.objectContaining({
            id: message.meta.id,
            source: {
              type: 'text',
              data: expect.objectContaining({
                id: text.meta.id,
                content: 'hello world',
              }),
            },
          }),
        ],
      }),
    )
  })
})
