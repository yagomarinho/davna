import { STORAGE_TYPE } from '@davna/infra'

import { downloadAudio } from '../download.audio'
import { isLeft, isRight } from '@davna/core'

import { StorageConstructor } from '../../../utils/storage'
import { createAudio, SUPPORTED_MIME_TYPE } from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from '../../__fakes__/classroom.fed.fake'
import { IDContextFake } from '../../__fakes__/id.context.fake'

describe('downloadAudio Service', () => {
  let repository: ClassroomFedRepository

  const downloadMock = jest.fn()

  const storage = (() => ({
    download: downloadMock,
  })) as any as StorageConstructor

  beforeEach(() => {
    repository = ClassroomFedFake({ IDContext: IDContextFake() })
    jest.clearAllMocks()
  })

  it('should return Left when audio is not found in repository', async () => {
    const result = await downloadAudio({
      audio_id: 'non-existent-audio',
    })({ storage, repository })

    expect(isLeft(result)).toBeTruthy()
    expect(result.value).toEqual({
      status: 'error',
      message: 'Audio not found',
    })
    expect(downloadMock).not.toHaveBeenCalled()
  })

  it('should return Left when storage.download does not return a buffer', async () => {
    const downloadMock = jest.fn().mockResolvedValue(null)
    const storage = (() => ({
      download: downloadMock,
    })) as unknown as StorageConstructor

    const audio = await repository.methods.set(
      createAudio({
        status: 'persistent',
        filename: 'test-audio',
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        url: 'https://example.com/audio.mp3',
        duration: 2000,
        metadata: {},
        storage: {
          type: STORAGE_TYPE.MONGO_GRIDFS,
          internal_id: 'file-123',
          bucket: 'bucket-name',
        },
      }),
    )

    const result = await downloadAudio({
      audio_id: audio.meta.id,
    })({ storage, repository })

    expect(isLeft(result)).toBeTruthy()
    expect(result.value).toEqual({
      status: 'error',
      message: 'Audio not found',
    })

    expect(downloadMock).toHaveBeenCalledTimes(1)
    expect(downloadMock).toHaveBeenCalledWith({
      identifier: 'file-123',
    })
  })

  it('should call storage.download with the correct identifier', async () => {
    const buffer = Buffer.from('audio-binary')
    const downloadMock = jest.fn().mockResolvedValue(buffer)
    const storage = (() => ({
      download: downloadMock,
    })) as unknown as StorageConstructor

    const audio = await repository.methods.set(
      createAudio({
        status: 'persistent',
        filename: 'lesson-audio',
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        url: 'https://example.com/lesson.mp3',
        duration: 3000,
        metadata: {},
        storage: {
          type: STORAGE_TYPE.MONGO_GRIDFS,
          internal_id: 'local-file-456',
          bucket: 'bucket-name',
        },
      }),
    )

    const result = await downloadAudio({
      audio_id: audio.meta.id as string,
    })({ storage, repository })

    expect(isRight(result)).toBeTruthy()
    expect(downloadMock).toHaveBeenCalledTimes(1)
    expect(downloadMock).toHaveBeenCalledWith({
      identifier: 'local-file-456',
    })
  })

  it('should return Right with the downloaded buffer when everything is valid', async () => {
    const downloadedBuffer = Buffer.from('some-audio-content')
    const downloadMock = jest.fn().mockResolvedValue(downloadedBuffer)
    const storage = (() => ({
      download: downloadMock,
    })) as unknown as StorageConstructor

    const audio = await repository.methods.set(
      createAudio({
        status: 'persistent',
        filename: 'practice-audio',
        mime_type: SUPPORTED_MIME_TYPE.MP3,
        metadata: {},
        url: 'https://example.com/practice.mp3',
        duration: 1500,
        storage: {
          type: STORAGE_TYPE.MONGO_GRIDFS,
          internal_id: 'practice-file-789',
          bucket: 'bucket-name',
        },
      }),
    )

    const result = await downloadAudio({
      audio_id: audio.meta.id,
    })({ storage, repository })

    expect(isRight(result)).toBeTruthy()
    const buffer = (result.value as any).buffer

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.equals(downloadedBuffer)).toBe(true)
  })
})
