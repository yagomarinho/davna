import {
  createAuthContext,
  createMeta,
  Left,
  Request,
  Right,
} from '@davna/core'
import { STORAGE_TYPE } from '@davna/infra'

import { createPresignedAudioHandler } from '../create.presigned.audio.handler'

import {
  authorizeConsumption,
  createPresignedAudio,
  getParticipantBySubjectId,
} from '../../../services'

import {
  AUDIO_STATUS,
  CONFIDENCE,
  SUPPORTED_MIME_TYPE,
  createAudio,
  createOwnership,
  createParticipant,
} from '../../../entities'
import { TIME_UNITS } from '@davna/kernel'

jest.mock('../../../services')

describe('create presigned audio handler', () => {
  const repository = { methods: {} }
  const storage = {} as any
  const scheduler = { schedule: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  function entityMeta(id: string) {
    const now = new Date()
    return createMeta({
      id,
      created_at: now,
      updated_at: now,
      _idempotency_key: '',
    })
  }

  const accountParticipant = createParticipant(
    { subject_id: 'account-1', type: 'costumer' },
    entityMeta('participant-account'),
  )

  const actorParticipant = createParticipant(
    { subject_id: 'agent-1', type: 'agent' },
    entityMeta('participant-actor'),
  )

  function request(overrides?: Partial<any>) {
    return Request({
      data: {
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        duration: {
          unit: TIME_UNITS.SEC,
          value: 30,
        },
      },
      metadata: {
        auth: createAuthContext(
          { id: 'account-1' },
          { type: 'agent', subject_id: 'agent-1' },
        ),
        ...overrides,
      },
    })
  }

  it('should return 401 when account or actor participant is invalid', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Left({ status: 'error', message: 'not found' })),
    )

    const result = await createPresignedAudioHandler(request())({
      repository,
      storage,
      scheduler,
    } as any)

    expect(result.metadata?.headers?.status).toBe(401)
    expect(result.data).toEqual({
      message: 'Invalid account id',
    })
  })

  it('should return 403 when consumption is not authorized', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock)
      .mockReturnValueOnce(() => Promise.resolve(Right(accountParticipant)))
      .mockReturnValueOnce(() => Promise.resolve(Right(actorParticipant)))
    ;(authorizeConsumption as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Left({ status: 'error', message: 'limit exceeded' })),
    )

    const result = await createPresignedAudioHandler(request())({
      repository,
      storage,
      scheduler,
    } as any)

    expect(result.metadata?.headers?.status).toBe(403)
    expect(result.data).toEqual({
      message: 'Consumption limit exceeded.. Try again later',
    })
  })

  it('should create a presigned audio and schedule expiration', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock)
      .mockReturnValueOnce(() => Promise.resolve(Right(accountParticipant)))
      .mockReturnValueOnce(() => Promise.resolve(Right(actorParticipant)))
    ;(authorizeConsumption as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(true)),
    )

    const audio = createAudio(
      {
        status: AUDIO_STATUS.PRESIGNED,
        filename: 'audio.mp3',
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        duration: 30,
        url: '',
        metadata: {
          presignedUrl: 'https://signed-url',
          expires_at: new Date('2030-01-01'),
        },
        storage: {
          bucket: 'bucket',
          internal_id: 'id',
          type: STORAGE_TYPE.AWS_S3,
        },
      },
      entityMeta('audio-1'),
    )

    const ownership = createOwnership({
      source_id: actorParticipant.meta.id,
      target_id: audio.meta.id,
      target_type: 'audio',
    })

    ;(createPresignedAudio as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right({ audio, ownership })),
    )

    const result = await createPresignedAudioHandler(
      request({ query: { confidence: CONFIDENCE.ESTIMATED } }),
    )({
      repository,
      storage,
      scheduler,
    } as any)

    expect(result.data).toEqual(
      expect.objectContaining({
        audio: expect.objectContaining({
          id: audio.meta.id,
        }),
        presigned_url: {
          url: 'https://signed-url',
          expires_at: new Date('2030-01-01'),
        },
      }),
    )

    expect(scheduler.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'handle_expired_audio',
        payload: { audio_id: audio.meta.id },
      }),
    )
  })
})
