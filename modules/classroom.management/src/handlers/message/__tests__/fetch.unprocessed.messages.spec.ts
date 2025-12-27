import { createMeta, Left, Request, Right } from '@davna/core'

import { fetchUnprocessedMessagesHandler } from '../fetch.unprocessed.messages.handler'
import {
  fetchUnprocessedMessages,
  UnprocessedMessage,
} from '../../../services/message/fetch.unprocessed.messages'
import {
  createAudio,
  createMessage,
  createOwnership,
  SUPPORTED_MIME_TYPE,
} from '../../../entities'
import { STORAGE_TYPE } from '@davna/infra'

jest.mock('../../../services/message/fetch.unprocessed.messages')

describe('fetch unprocessed messages handler', () => {
  const repository = {
    methods: {},
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 when service returns error', async () => {
    ;(fetchUnprocessedMessages as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'Invalid classroom',
        }),
      ),
    )

    const result = await fetchUnprocessedMessagesHandler(
      Request.data({
        classroom_id: 'classroom-1',
      }),
    )({ repository } as any)

    expect(result.metadata?.headers?.status).toBe(400)
    expect(result.data).toEqual({
      message: 'Invalid classroom',
    })
  })

  it('should fetch a single page of unprocessed messages', async () => {
    const message: UnprocessedMessage = {
      classroom_id: 'classroom-1',
      message: createMessage(
        {},
        createMeta({
          id: 'message-1',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
      ),
      messageOwnership: createOwnership(
        {
          target_type: 'message',
          target_id: 'message-1',
          source_id: 'participant-1',
        },
        createMeta({
          id: 'ownership-1',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
      ),
      audio: createAudio(
        {
          status: 'persistent',
          filename: 'name',
          mime_type: SUPPORTED_MIME_TYPE.MP3,
          url: '',
          duration: 10,
          metadata: {},
          storage: {
            bucket: 'bucket',
            internal_id: 'internal_id',
            type: STORAGE_TYPE.AWS_S3,
          },
        },
        createMeta({
          id: 'audio-1',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
      ),
      audioOwnership: createOwnership(
        {
          target_type: 'audio',
          target_id: 'audio-1',
          source_id: 'participant-1',
        },
        createMeta({
          id: 'ownership-2',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
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

    const result = await fetchUnprocessedMessagesHandler(
      Request.data({
        classroom_id: 'classroom-1',
      }),
    )({ repository } as any)

    expect(result.data).toEqual(
      expect.objectContaining({
        unprocessed_messages: [
          expect.objectContaining({
            id: 'message-1',
          }),
        ],
      }),
    )
  })

  it('should fetch multiple pages until batch is completed', async () => {
    const msg1: UnprocessedMessage = {
      classroom_id: 'classroom-1',
      message: createMessage(
        {},
        createMeta({
          id: 'message-1',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
      ),
      messageOwnership: createOwnership(
        {
          target_type: 'message',
          target_id: 'message-1',
          source_id: 'participant-1',
        },
        createMeta({
          id: 'ownership-1',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
      ),
      audio: createAudio(
        {
          status: 'persistent',
          filename: 'name',
          mime_type: SUPPORTED_MIME_TYPE.MP3,
          url: '',
          duration: 10,
          metadata: {},
          storage: {
            bucket: 'bucket',
            internal_id: 'internal_id',
            type: STORAGE_TYPE.AWS_S3,
          },
        },
        createMeta({
          id: 'audio-1',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
      ),
      audioOwnership: createOwnership(
        {
          target_type: 'audio',
          target_id: 'audio-1',
          source_id: 'participant-1',
        },
        createMeta({
          id: 'ownership-2',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
      ),
    }

    const msg2: UnprocessedMessage = {
      classroom_id: 'classroom-1',
      message: createMessage(
        {},
        createMeta({
          id: 'message-2',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
      ),
      messageOwnership: createOwnership(
        {
          target_type: 'message',
          target_id: 'message-2',
          source_id: 'participant-1',
        },
        createMeta({
          id: 'ownership-3',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
      ),
      audio: createAudio(
        {
          status: 'persistent',
          filename: 'name',
          mime_type: SUPPORTED_MIME_TYPE.MP3,
          url: '',
          duration: 10,
          metadata: {},
          storage: {
            bucket: 'bucket',
            internal_id: 'internal_id',
            type: STORAGE_TYPE.AWS_S3,
          },
        },
        createMeta({
          id: 'audio-2',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
      ),
      audioOwnership: createOwnership(
        {
          target_type: 'audio',
          target_id: 'audio-2',
          source_id: 'participant-1',
        },
        createMeta({
          id: 'ownership-4',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
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
      Request.data({
        classroom_id: 'classroom-1',
      }),
    )({ repository, config: { batch_size: 1 } } as any)

    expect(result.data).toEqual({
      unprocessed_messages: [
        expect.objectContaining({ id: 'message-1' }),
        expect.objectContaining({ id: 'message-2' }),
      ],
    })

    expect(fetchUnprocessedMessages).toHaveBeenCalledTimes(2)
  })

  it('should stop fetching when page size is smaller than batch size', async () => {
    const messages: UnprocessedMessage[] = [
      {
        classroom_id: 'classroom-1',
        message: createMessage(
          {},
          createMeta({
            id: 'message-1',
            created_at: new Date(),
            updated_at: new Date(),
            _idempotency_key: '',
          }),
        ),
        messageOwnership: createOwnership(
          {
            target_type: 'message',
            target_id: 'message-1',
            source_id: 'participant-1',
          },
          createMeta({
            id: 'ownership-1',
            created_at: new Date(),
            updated_at: new Date(),
            _idempotency_key: '',
          }),
        ),
        audio: createAudio(
          {
            status: 'persistent',
            filename: 'name',
            mime_type: SUPPORTED_MIME_TYPE.MP3,
            url: '',
            duration: 10,
            metadata: {},
            storage: {
              bucket: 'bucket',
              internal_id: 'internal_id',
              type: STORAGE_TYPE.AWS_S3,
            },
          },
          createMeta({
            id: 'audio-1',
            created_at: new Date(),
            updated_at: new Date(),
            _idempotency_key: '',
          }),
        ),
        audioOwnership: createOwnership(
          {
            target_type: 'audio',
            target_id: 'audio-1',
            source_id: 'participant-1',
          },
          createMeta({
            id: 'ownership-2',
            created_at: new Date(),
            updated_at: new Date(),
            _idempotency_key: '',
          }),
        ),
      },
      {
        classroom_id: 'classroom-1',
        message: createMessage(
          {},
          createMeta({
            id: 'message-2',
            created_at: new Date(),
            updated_at: new Date(),
            _idempotency_key: '',
          }),
        ),
        messageOwnership: createOwnership(
          {
            target_type: 'message',
            target_id: 'message-2',
            source_id: 'participant-1',
          },
          createMeta({
            id: 'ownership-3',
            created_at: new Date(),
            updated_at: new Date(),
            _idempotency_key: '',
          }),
        ),
        audio: createAudio(
          {
            status: 'persistent',
            filename: 'name',
            mime_type: SUPPORTED_MIME_TYPE.MP3,
            url: '',
            duration: 10,
            metadata: {},
            storage: {
              bucket: 'bucket',
              internal_id: 'internal_id',
              type: STORAGE_TYPE.AWS_S3,
            },
          },
          createMeta({
            id: 'audio-2',
            created_at: new Date(),
            updated_at: new Date(),
            _idempotency_key: '',
          }),
        ),
        audioOwnership: createOwnership(
          {
            target_type: 'audio',
            target_id: 'audio-2',
            source_id: 'participant-1',
          },
          createMeta({
            id: 'ownership-4',
            created_at: new Date(),
            updated_at: new Date(),
            _idempotency_key: '',
          }),
        ),
      },
    ]

    ;(fetchUnprocessedMessages as any as jest.Mock).mockReturnValueOnce(() =>
      Promise.resolve(
        Right({
          unprocessed_messages: messages,
          next_cursor: 'cursor-should-be-ignored',
        }),
      ),
    )

    const result = await fetchUnprocessedMessagesHandler(
      Request.data({
        classroom_id: 'classroom-1',
      }),
    )({ repository } as any)

    expect(result.data?.unprocessed_messages).toHaveLength(2)
    expect(fetchUnprocessedMessages).toHaveBeenCalledTimes(1)
  })
})
