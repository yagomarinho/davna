import { isRight } from '@davna/core'

import { persistAudio } from '../persist.audio'
import {
  Audio,
  AudioURI,
  createAudio,
  SUPPORTED_MIME_TYPE,
} from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from '../../__fakes__/classroom.fed.fake'
import { IDContext, STORAGE_TYPE } from '@davna/infra'
import { IDContextFake } from '../../__fakes__/id.context.fake'

describe('persist audio service', () => {
  let repository: ClassroomFedRepository
  let IDContext: IDContext

  beforeEach(() => {
    IDContext = IDContextFake()
    repository = ClassroomFedFake({ IDContext })

    jest.clearAllMocks()
  })

  it('should persist audio changing status to persistent and keep same identity', async () => {
    process.env.API_BASE_URL = 'http://localhost:3000'

    const audio = await repository.methods.set(
      createAudio({
        status: 'presigned',
        filename: 'tmp-file',
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        duration: 10,
        url: '',
        metadata: {
          presignedUrl: 'http://signed-url',
          expires_at: new Date(),
        },
        storage: {
          bucket: 'bucket',
          internal_id: 'internal-id',
          type: STORAGE_TYPE.AWS_S3,
        },
      }),
    )

    const result = await persistAudio({
      audio,
      props: {
        filename: 'final-file.mp3',
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        duration: 10,
        metadata: {
          processed: true,
        },
        storage: {
          bucket: 'bucket',
          internal_id: 'internal-id',
          type: STORAGE_TYPE.AWS_S3,
        },
      },
    })({ repository } as any)

    expect(isRight(result)).toBeTruthy()

    const persisted = (result as any).value as Audio

    expect(persisted._t).toBe(AudioURI)
    expect(persisted.meta.id).toBe(audio.meta.id)

    expect(persisted.props).toEqual(
      expect.objectContaining({
        status: 'persistent',
        filename: 'final-file.mp3',
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        duration: 10,
        url: `http://localhost:3000/audio/${audio.meta.id}`,
        metadata: expect.objectContaining({
          props: expect.objectContaining({
            presignedUrl: 'http://signed-url',
            processed: true,
          }),
        }),
      }),
    )
  })

  it('should override metadata preserving previous values', async () => {
    process.env.API_BASE_URL = 'http://localhost:3000'

    const audio = await repository.methods.set(
      createAudio({
        status: 'presigned',
        filename: 'tmp',
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        duration: 5,
        url: '',
        metadata: {
          foo: 'bar',
        },
        storage: {
          bucket: 'bucket',
          internal_id: 'id',
          type: STORAGE_TYPE.AWS_S3,
        },
      }),
    )

    const result = await persistAudio({
      audio,
      props: {
        filename: 'final',
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        duration: 5,
        metadata: {
          baz: 'qux',
        },
        storage: {
          bucket: 'bucket',
          internal_id: 'id',
          type: STORAGE_TYPE.AWS_S3,
        },
      },
    })({ repository } as any)

    expect(isRight(result)).toBeTruthy()

    const persisted = (result as any).value as Audio

    expect(persisted.props.metadata.props).toEqual(
      expect.objectContaining({
        foo: 'bar',
        baz: 'qux',
      }),
    )
  })
})
