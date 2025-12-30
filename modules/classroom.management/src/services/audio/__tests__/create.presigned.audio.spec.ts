import { isRight } from '@davna/core'
import { IDContext, Storage } from '@davna/infra'
import { TIME_UNITS } from '@davna/kernel'

import { createPresignedAudio } from '../create.presigned.audio'
import {
  Audio,
  AudioURI,
  CONFIDENCE,
  Ownership,
  SUPPORTED_MIME_TYPE,
  Usage,
} from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'

import { ClassroomFedFake } from '../../__fakes__/classroom.fed.fake'
import { IDContextFake } from '../../__fakes__/id.context.fake'

describe('create presigned audio service', () => {
  let repository: ClassroomFedRepository
  let IDContext: IDContext

  const storage: Storage = {
    getSignedUrl: jest.fn(),
  } as any

  beforeEach(async () => {
    IDContext = IDContextFake()
    repository = ClassroomFedFake({ IDContext })
    ;(storage.getSignedUrl as jest.Mock).mockResolvedValue({
      url: 'https://signed.url',
      expires_at: new Date(),
      identifier: 'internal-id',
      storage_type: 's3',
      bucket: 'bucket',
    })

    jest.clearAllMocks()
  })

  it('should be able to create a presigned audio and persist audio, usage and ownership', async () => {
    const owner_id = 'owner-1'
    const usage_participant_id = 'participant_id'

    const result = await createPresignedAudio({
      confidence: CONFIDENCE.DETERMINISTIC,
      owner_id,
      usage_participant_id: usage_participant_id,
      mime_type: SUPPORTED_MIME_TYPE.MP3,
      duration: {
        unit: TIME_UNITS.SEC,
        value: 120,
      },
    })({
      repository,
      storage,
    })

    expect(isRight(result)).toBeTruthy()

    const { audio, usage, ownership } = (result as any).value as {
      audio: Audio
      usage: Usage
      ownership: Ownership
    }

    expect(audio).toEqual(
      expect.objectContaining({
        _t: AudioURI,
        props: expect.objectContaining({
          status: 'presigned',
          mime_type: 'audio/mpeg',
          duration: 120,
          metadata: expect.objectContaining({
            props: expect.objectContaining({
              presigned_url: 'https://signed.url',
            }),
          }),
        }),
      }),
    )

    expect(usage).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          source_id: usage_participant_id,
          target_id: audio.meta.id,
          target_type: AudioURI,
          consumption: expect.objectContaining({
            props: expect.objectContaining({
              unit: TIME_UNITS.SEC,
              value: 120,
            }),
          }),
          metadata: expect.objectContaining({
            props: expect.objectContaining({
              presigned_url: 'https://signed.url',
              confidence: CONFIDENCE.DETERMINISTIC,
            }),
          }),
        }),
      }),
    )

    expect(ownership).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          source_id: owner_id,
          target_id: audio.meta.id,
          target_type: AudioURI,
        }),
      }),
    )
  })
})
