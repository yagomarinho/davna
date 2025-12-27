import { createMeta, Left, Request, Right } from '@davna/core'

import { appendMessageHandler } from '../append.message.handler'

import {
  ParticipantURI,
  OwnershipURI,
  createMessage,
  createOwnership,
  createAudio,
} from '../../../entities'
import {
  appendMessageToClassroom,
  ensureClassroomParticipation,
  ensureOwnershipToTargetResource,
  getAudio,
  getOwnershipFromResource,
  getParticipant,
  invalidatePresignedURL,
  persistAudio,
} from '../../../services'
import { STORAGE_TYPE } from '@davna/infra'
import { concatenate } from '@davna/kernel'

jest.mock('../../../services')

describe('append message handler', () => {
  const repository = { methods: {} } as any

  const multimedia = {
    convert: jest.fn(),
  }

  const storageInstance = {
    download: jest.fn(),
    upload: jest.fn(),
  }

  const storage = jest.fn(() => storageInstance)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be able to append audio message to classroom', async () => {
    const classroom_id = 'classroom-1'
    const audio_id = 'audio-1'
    const presigned_url = 'signed-url'

    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(undefined)),
    )

    const participant = {
      _t: ParticipantURI,
      meta: { id: 'participant-1' },
    }

    ;(getParticipant as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )

    const audio = createAudio(
      {
        status: 'presigned',
        filename: 'temp',
        mime_type: '',
        duration: 10,
        url: '',
        metadata: {
          presigned_url,
          expires_at: new Date(Date.now() + 10_000),
        },
        storage: {
          bucket: 'bucket',
          internal_id: 'internal-id',
          type: STORAGE_TYPE.AWS_S3,
        },
      },
      createMeta({
        id: 'audio-id',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      }),
    )

    ;(getAudio as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(audio)),
    )
    ;(invalidatePresignedURL as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(undefined)),
    )
    ;(ensureOwnershipToTargetResource as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right({ _t: OwnershipURI })),
    )

    const audioOwnership = createOwnership(
      {
        source_id: participant.meta.id,
        target_id: audio.meta.id,
        target_type: 'audio',
      },
      createMeta({
        id: 'audio-ownership-id',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      }),
    )

    ;(getOwnershipFromResource as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(audioOwnership)),
    )

    storageInstance.download.mockResolvedValue(Buffer.from('audio'))
    multimedia.convert.mockResolvedValue({
      buffer: Buffer.from('converted'),
      duration: 10,
      mime: 'audio/mpeg',
    })

    storageInstance.upload.mockResolvedValue({
      bucket: 'bucket',
      identifier: 'id',
      storage_type: 's3',
    })

    const persistedAudio = createAudio(
      concatenate(audio.props, {
        status: 'persistent',
        metadata: {},
        storage: audio.props.storage.props,
      }),
      audio.meta,
    )
    ;(persistAudio as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(persistedAudio)),
    )

    const message = createMessage(
      {},
      createMeta({
        id: 'message-id',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      }),
    )
    const messageOwnership = createOwnership(
      {
        source_id: participant.meta.id,
        target_id: message.meta.id,
        target_type: 'message',
      },
      createMeta({
        id: 'message-ownership-id',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      }),
    )

    ;(appendMessageToClassroom as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Right({
          message,
          messageOwnership,
        }),
      ),
    )

    const result = await appendMessageHandler(
      Request.data({
        participant_id: participant.meta.id,
        classroom_id,
        resource: {
          id: audio_id,
          metadata: { presigned_url },
        },
      }),
    )({ repository, multimedia, storage } as any)

    expect(result.data).toEqual(
      expect.objectContaining({
        message: expect.any(Object),
      }),
    )
  })

  it('should return 401 when user is not participant of classroom', async () => {
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'Unauthorized',
        }),
      ),
    )

    const result = await appendMessageHandler(
      Request.data({
        participant_id: 'not-participant',
        classroom_id: 'classroom-1',
        resource: {
          id: 'audio-1',
          metadata: { presigned_url: 'url' },
        },
      }),
    )({ repository } as any)

    expect(result.metadata?.headers?.status).toBe(401)
    expect(result.data).toEqual({ message: 'Unauthorized' })
  })

  it('should return 400 when audio is invalid or presigned url does not match', async () => {
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(undefined)),
    )
    ;(getParticipant as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right({ meta: { id: 'p1' } })),
    )
    ;(getAudio as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Right({
          props: {
            metadata: { props: { presigned_url: 'other-url' } },
          },
        }),
      ),
    )

    const result = await appendMessageHandler(
      Request.data({
        participant_id: 'participant-1',
        classroom_id: 'classroom-1',
        resource: {
          id: 'audio-1',
          metadata: { presigned_url: 'expected-url' },
        },
      }),
    )({ repository } as any)

    expect(result.metadata?.headers?.status).toBe(400)
    expect(result.data).toEqual({ message: 'Invalid audio to append' })
  })

  it('should return 401 when audio ownership is invalid', async () => {
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(undefined)),
    )
    ;(getParticipant as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right({ meta: { id: 'p1' } })),
    )
    ;(getAudio as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Right({
          meta: { id: 'audio' },
          props: {
            metadata: {
              props: {
                presigned_url: 'url',
                expires_at: new Date(Date.now() + 10_000),
              },
            },
            storage: { props: {} },
          },
        }),
      ),
    )
    ;(invalidatePresignedURL as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(undefined)),
    )
    ;(ensureOwnershipToTargetResource as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'No ownership',
        }),
      ),
    )

    const result = await appendMessageHandler(
      Request.data({
        participant_id: 'p1',
        classroom_id: 'classroom',
        resource: {
          id: 'audio',
          metadata: { presigned_url: 'url' },
        },
      }),
    )({ repository } as any)

    expect(result.metadata?.headers?.status).toBe(401)
    expect(result.data).toEqual({ message: 'No ownership' })
  })
})
