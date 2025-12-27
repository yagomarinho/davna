import { Left, Request, Right } from '@davna/core'

import { createPresignedAudioHandler } from '../create.presigned.audio.handler'
import { authorizeConsumption } from '../../../services/usage/authorize.consumption'
import { createPresignedAudio } from '../../../services/audio/create.presigned.audio'
import {
  AudioURI,
  OwnershipURI,
  SUPPORTED_MIME_TYPE,
  USAGE_UNITS,
} from '../../../entities'

jest.mock('../../../services/usage/authorize.consumption')
jest.mock('../../../services/audio/create.presigned.audio')

describe('create presigned audio handler', () => {
  const repository = {
    methods: {},
  }

  const storage = {}

  const participant = {
    id: 'participant-id',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when consumption is not authorized', async () => {
    ;(authorizeConsumption as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'Has no consumption left',
        }),
      ),
    )

    const result = await createPresignedAudioHandler(
      Request.data({
        participant_id: participant.id,
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        duration: {
          unit: USAGE_UNITS.SECONDS,
          value: 60,
        },
      }),
    )({ repository, storage } as any)

    expect(result.metadata?.headers?.status).toBe(401)
    expect(result.data).toEqual({
      message: 'Has no consumption left. Try again later',
    })
  })

  it('should create presigned audio when consumption is authorized', async () => {
    ;(authorizeConsumption as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right([])),
    )

    const audio = {
      _t: AudioURI,
      meta: { id: 'audio-1' },
      props: {
        storage: {
          props: {},
        },
        metadata: {
          props: {
            presignedUrl: 'https://signed.url',
            expires_at: new Date('2030-01-01'),
          },
        },
      },
    }

    const ownership = {
      _t: OwnershipURI,
      props: {
        target_id: 'audio-1',
      },
    }

    ;(createPresignedAudio as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Right({
          audio,
          ownership,
        }),
      ),
    )

    const result = await createPresignedAudioHandler(
      Request.data({
        participant_id: participant.id,
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        duration: {
          unit: USAGE_UNITS.SECONDS,
          value: 120,
        },
      }),
    )({ repository, storage } as any)

    expect(result.data).toEqual({
      audio: expect.objectContaining({
        id: 'audio-1',
      }),
      presigned_url: {
        url: 'https://signed.url',
        expires_at: new Date('2030-01-01'),
      },
    })
  })

  it('should throw when createPresignedAudio returns Left', async () => {
    ;(authorizeConsumption as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right([])),
    )
    ;(createPresignedAudio as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'invalid audio',
        }),
      ),
    )

    await expect(
      createPresignedAudioHandler(
        Request.data({
          participant_id: participant.id,
          mime_type: SUPPORTED_MIME_TYPE.MP3,
          duration: {
            unit: USAGE_UNITS.SECONDS,
            value: 10,
          },
        }),
      )({ repository, storage } as any),
    ).rejects.toThrow()
  })
})
