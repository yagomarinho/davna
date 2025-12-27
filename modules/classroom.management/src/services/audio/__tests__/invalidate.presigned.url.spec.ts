import { isRight } from '@davna/core'

import { invalidatePresignedURL } from '../invalidate.presigned.url'
import { Audio, SUPPORTED_MIME_TYPE, createAudio } from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from '../../__fakes__/classroom.fed.fake'
import { IDContext, STORAGE_TYPE } from '@davna/infra'
import { IDContextFake } from '../../__fakes__/id.context.fake'

describe('invalidate presigned url service', () => {
  let repository: ClassroomFedRepository
  let IDContext: IDContext

  beforeEach(() => {
    IDContext = IDContextFake()
    repository = ClassroomFedFake({ IDContext })

    jest.clearAllMocks()
  })

  it('should invalidate presigned url and expires_at metadata keeping same audio identity', async () => {
    const audio = await repository.methods.set(
      createAudio({
        status: 'presigned',
        filename: 'tmp-audio',
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        duration: 10,
        url: '',
        metadata: {
          presigned_url: 'http://signed-url',
          expires_at: new Date(),
          any: 'value',
        },
        storage: {
          bucket: 'bucket',
          internal_id: 'internal-id',
          type: STORAGE_TYPE.AWS_S3,
        },
      }),
    )

    const result = await invalidatePresignedURL({
      audio,
    })({ repository })

    expect(isRight(result)).toBeTruthy()

    const persisted = await repository.methods.get(audio.meta.id)
    const updated = persisted as Audio

    expect(updated.meta.id).toBe(audio.meta.id)

    expect(updated.props.metadata.props).toEqual(
      expect.objectContaining({
        presigned_url: undefined,
        expires_at: undefined,
        any: 'value',
      }),
    )
  })

  it('should persist audio even when presigned metadata does not exist', async () => {
    const audio = await repository.methods.set(
      createAudio({
        status: 'persistent',
        filename: 'audio',
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        duration: 5,
        url: 'http://any-url',
        metadata: {
          any: 'value',
        },
        storage: {
          bucket: 'bucket',
          internal_id: 'id',
          type: STORAGE_TYPE.AWS_S3,
        },
      }),
    )

    const result = await invalidatePresignedURL({
      audio,
    })({ repository })

    expect(isRight(result)).toBeTruthy()

    const persisted = await repository.methods.get(audio.meta.id)
    const updated = persisted as Audio

    expect(updated.props.metadata.props).toEqual(
      expect.objectContaining({
        any: 'value',
        presigned_url: undefined,
        expires_at: undefined,
      }),
    )
  })
})
