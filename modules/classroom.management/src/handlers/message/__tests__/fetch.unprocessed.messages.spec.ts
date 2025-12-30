import {
  createAuthContext,
  createMeta,
  Left,
  Request,
  Right,
} from '@davna/core'
import { fetchUnprocessedMessagesHandler } from '../fetch.unprocessed.messages.handler'

import {
  fetchUnprocessedMessages,
  UnprocessedMessage,
  ensureClassroomParticipation,
  getParticipantBySubjectId,
} from '../../../services'

import {
  AUDIO_STATUS,
  createAudio,
  createMessage,
  createOwnership,
  createParticipant,
  SUPPORTED_MIME_TYPE,
} from '../../../entities'

import { STORAGE_TYPE } from '@davna/infra'

jest.mock('../../../services')

describe('fetch unprocessed messages handler', () => {
  const repository = {
    methods: {},
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const participant = createParticipant(
    {
      subject_id: 'subject-1',
      type: 'costumer',
    },
    createMeta({
      id: 'participant-1',
      created_at: new Date(),
      updated_at: new Date(),
      _idempotency_key: '',
    }),
  )

  function entityMeta(id: string) {
    const now = new Date()
    return createMeta({
      id,
      created_at: now,
      updated_at: now,
      _idempotency_key: '',
    })
  }

  function authRequest(overrides?: Partial<any>) {
    return Request.metadata({
      auth: createAuthContext(
        { id: 'account-1' },
        { type: 'agent', subject_id: 'subject-1' },
      ),
      params: { id: 'classroom-1' },
      ...overrides,
    })
  }

  it('should return 400 when participant is not found', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'Participant not found',
        }),
      ),
    )

    const result = await fetchUnprocessedMessagesHandler(authRequest())({
      repository,
    } as any)

    expect(result.metadata?.headers?.status).toBe(400)
    expect(result.data).toEqual({
      message: 'Participant not found',
    })
  })

  it('should return 401 when participant is not part of classroom', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'Not allowed',
        }),
      ),
    )

    const result = await fetchUnprocessedMessagesHandler(authRequest())({
      repository,
    } as any)

    expect(result.metadata?.headers?.status).toBe(401)
    expect(result.data).toEqual({
      message: 'Not allowed',
    })
  })

  it('should return 400 when service returns error', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(true)),
    )
    ;(fetchUnprocessedMessages as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'Invalid classroom',
        }),
      ),
    )

    const result = await fetchUnprocessedMessagesHandler(authRequest())({
      repository,
    } as any)

    expect(result.metadata?.headers?.status).toBe(400)
    expect(result.data).toEqual({
      message: 'Invalid classroom',
    })
  })

  it('should fetch a single page of unprocessed messages', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(true)),
    )

    const message: UnprocessedMessage = {
      classroom_id: 'classroom-1',
      message: createMessage({}, entityMeta('message-1')),
      messageOwnership: createOwnership(
        {
          source_id: participant.meta.id,
          target_id: 'message-1',
          target_type: 'message',
        },
        entityMeta('ownership-1'),
      ),
      audio: createAudio(
        {
          status: AUDIO_STATUS.PERSISTENT,
          filename: 'audio.mp3',
          mime_type: SUPPORTED_MIME_TYPE.MP3,
          duration: 10,
          url: '',
          metadata: {},
          storage: {
            bucket: 'bucket',
            internal_id: 'id',
            type: STORAGE_TYPE.AWS_S3,
          },
        },
        entityMeta('audio-1'),
      ),
      audioOwnership: createOwnership(
        {
          source_id: participant.meta.id,
          target_id: 'audio-1',
          target_type: 'audio',
        },
        entityMeta('audio-ownership'),
      ),
    }

    ;(fetchUnprocessedMessages as any as jest.Mock).mockReturnValueOnce(() =>
      Promise.resolve(
        Right({
          unprocessed_messages: [message],
          next_cursor: undefined,
        }),
      ),
    )

    const result = await fetchUnprocessedMessagesHandler(authRequest())({
      repository,
    } as any)

    expect(result.data).toEqual(
      expect.objectContaining({
        unprocessed_messages: [
          expect.objectContaining({
            id: 'message-1',
          }),
        ],
      }),
    )

    expect(fetchUnprocessedMessages).toHaveBeenCalledTimes(1)
  })

  it('should fetch multiple pages until batch is completed', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(true)),
    )

    const msg1 = {
      classroom_id: 'classroom-1',
      message: createMessage({}, entityMeta('message-1')),
      messageOwnership: createOwnership(
        {
          source_id: participant.meta.id,
          target_id: 'message-1',
          target_type: 'message',
        },
        entityMeta('ownership-1'),
      ),
      audio: createAudio(
        {
          status: AUDIO_STATUS.PERSISTENT,
          filename: 'audio1.mp3',
          mime_type: SUPPORTED_MIME_TYPE.MP3,
          duration: 10,
          url: '',
          metadata: {},
          storage: {
            bucket: 'bucket',
            internal_id: '1',
            type: STORAGE_TYPE.AWS_S3,
          },
        },
        entityMeta('audio-1'),
      ),
      audioOwnership: createOwnership(
        {
          source_id: participant.meta.id,
          target_id: 'audio-1',
          target_type: 'audio',
        },
        entityMeta('ownership-2'),
      ),
    }

    const msg2 = {
      classroom_id: 'classroom-1',
      message: createMessage({}, entityMeta('message-2')),
      messageOwnership: createOwnership(
        {
          source_id: participant.meta.id,
          target_id: 'message-2',
          target_type: 'message',
        },
        entityMeta('ownership-3'),
      ),
      audio: createAudio(
        {
          status: AUDIO_STATUS.PERSISTENT,
          filename: 'audio2.mp3',
          mime_type: SUPPORTED_MIME_TYPE.MP3,
          duration: 10,
          url: '',
          metadata: {},
          storage: {
            bucket: 'bucket',
            internal_id: '2',
            type: STORAGE_TYPE.AWS_S3,
          },
        },
        entityMeta('audio-2'),
      ),
      audioOwnership: createOwnership(
        {
          source_id: participant.meta.id,
          target_id: 'audio-2',
          target_type: 'audio',
        },
        entityMeta('ownership-4'),
      ),
    }

    ;(fetchUnprocessedMessages as any as jest.Mock)
      .mockReturnValueOnce(() =>
        Promise.resolve(
          Right({
            unprocessed_messages: [msg1],
            next_cursor: 'cursor-1',
          }),
        ),
      )
      .mockReturnValueOnce(() =>
        Promise.resolve(
          Right({
            unprocessed_messages: [msg2],
            next_cursor: undefined,
          }),
        ),
      )

    const result = await fetchUnprocessedMessagesHandler(
      authRequest({ query: { batch_size: 1 } }),
    )({ repository } as any)

    expect(result.data?.unprocessed_messages).toHaveLength(2)
    expect(fetchUnprocessedMessages).toHaveBeenCalledTimes(2)
  })
})
