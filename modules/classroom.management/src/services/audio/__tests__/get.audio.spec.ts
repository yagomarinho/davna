import { isLeft, isRight } from '@davna/core'

import { getAudio } from '../get.audio'
import { createAudio, createMessage } from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from '../../__fakes__/classroom.fed.fake'
import { IDContextFake } from '../../__fakes__/id.context.fake'
import { IDContext, STORAGE_TYPE } from '@davna/infra'

describe('get audio service', () => {
  let repository: ClassroomFedRepository
  let IDContext: IDContext

  beforeEach(async () => {
    IDContext = IDContextFake()
    repository = ClassroomFedFake({ IDContext })

    jest.clearAllMocks()
  })

  it('should be able to get audio by id', async () => {
    const audio = await repository.methods.set(
      createAudio({
        status: 'persistent',
        filename: 'audio.mp3',
        mime_type: 'audio/mpeg',
        duration: 60,
        url: 'http://audio.url',
        metadata: {},
        storage: {
          bucket: 'bucket',
          internal_id: 'internal-id',
          type: STORAGE_TYPE.AWS_S3,
        },
      }),
    )

    const result = await getAudio({ audio_id: audio.meta.id })({
      repository,
    })

    expect(isRight(result)).toBeTruthy()
    expect(result.value).toEqual(audio)
  })

  it('should not be able to get audio when audio does not exist', async () => {
    const result = await getAudio({ audio_id: 'invalid-audio-id' })({
      repository,
    })

    expect(isLeft(result)).toBeTruthy()
  })

  it('should not be able to get audio when entity is not an audio', async () => {
    const notAudio = await repository.methods.set(createMessage())

    const result = await getAudio({ audio_id: notAudio.meta.id })({
      repository,
    })

    expect(isLeft(result)).toBeTruthy()
  })
})
