import { Readable } from 'node:stream'

import { isLeft, isRight } from '@davna/core'
import { STORAGE_TYPE } from '@davna/providers'
import { InMemoryRepository } from '@davna/repositories'

import { Audio, SUPORTED_MIME_TYPE } from '../../entities/audio'
import { uploadAudio } from '../upload.audio'
import { StorageConstructor } from '../../utils/storage'

describe('uploadAudio Service', () => {
  const storage_driver = STORAGE_TYPE.MONGO_GRIDFS

  it('should return Left when MIME type is not supported', async () => {
    const uploadMock = jest.fn()
    const storage = (() => ({
      upload: uploadMock,
    })) as unknown as StorageConstructor
    const audios = InMemoryRepository<Audio>()

    const result = await uploadAudio({
      owner_id: 'owner-1',
      name: 'invalid-mime-audio',
      mime: 'text/plain',
      duration: 1000,
      buffer: Buffer.from('dummy-audio'),
    })({ storage, audios, storage_driver })

    expect(isLeft(result)).toBeTruthy()
    expect(result.value).toEqual({
      status: 'error',
      message: 'Unsupported MimeType: text/plain',
    })
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('should call storage.upload with a Readable stream and correct metadata', async () => {
    const uploadMock = jest.fn().mockResolvedValue({
      identifier: 'file-1',
      storage_type: 'S3',
      url: 'https://storage.example.com/file-1',
    })

    const storage = (() => ({
      upload: uploadMock,
    })) as unknown as StorageConstructor
    const audios = InMemoryRepository<Audio>()

    const [supportedMime] = Object.values(SUPORTED_MIME_TYPE)
    const buffer = Buffer.from('audio-binary-content')

    const result = await uploadAudio({
      owner_id: 'owner-1',
      name: 'my-audio',
      mime: supportedMime,
      duration: 3000,
      buffer,
    })({ storage, audios, storage_driver })

    expect(isRight(result)).toBeTruthy()
    expect(uploadMock).toHaveBeenCalledTimes(1)

    const [uploadArgs] = uploadMock.mock.calls[0]
    const { source, metadata } = uploadArgs

    expect(source).toBeInstanceOf(Readable)
    expect(metadata).toEqual({
      mime: supportedMime,
      duration: 3000,
      name: 'my-audio',
      owner_id: 'owner-1',
    })
  })

  it('should persist the created audio on audios repository and return Right', async () => {
    const uploadMock = jest.fn().mockResolvedValue({
      identifier: 'file-2',
      storage_type: STORAGE_TYPE.AWS_S3,
    })

    const storage = (() => ({
      upload: uploadMock,
    })) as unknown as StorageConstructor
    const audios = InMemoryRepository<Audio>()
    const setSpy = jest.spyOn(audios, 'set')

    const [supportedMime] = Object.values(SUPORTED_MIME_TYPE)

    const result = await uploadAudio({
      owner_id: 'owner-2',
      name: 'lesson-audio',
      mime: supportedMime,
      duration: 2000,
      buffer: Buffer.from('audio'),
    })({ storage, audios, storage_driver })

    expect(isRight(result)).toBeTruthy()

    const audio = result.value as Audio

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_id: audio.owner_id,
        name: audio.name,
        mime: audio.mime,
        src: audio.src,
        internal_ref: audio.internal_ref,
        duration: audio.duration,
      }),
    )
    expect(audio).toMatchObject({
      owner_id: 'owner-2',
      name: 'lesson-audio',
      mime: supportedMime,
      src: `${process.env.API_BASE_URL}/audio/${audio.id}`,
      internal_ref: {
        storage: STORAGE_TYPE.AWS_S3,
        identifier: 'file-2',
      },
      duration: 2000,
    })
  })

  it('should propagate storage information into audio entity correctly', async () => {
    const storageResponse = {
      identifier: 'storage-123',
      storage_type: 'LOCAL',
    }

    const uploadMock = jest.fn().mockResolvedValue(storageResponse)
    const storage = (() => ({
      upload: uploadMock,
    })) as unknown as StorageConstructor
    const audios = InMemoryRepository<Audio>()

    const [supportedMime] = Object.values(SUPORTED_MIME_TYPE)

    const result = await uploadAudio({
      owner_id: 'owner-3',
      name: 'practice-audio',
      mime: supportedMime,
      duration: 1500,
      buffer: Buffer.from('audio-binary'),
    })({ storage, audios, storage_driver })

    expect(isRight(result)).toBeTruthy()

    const audio = result.value as Audio

    expect(audio.internal_ref).toEqual({
      storage: storageResponse.storage_type,
      identifier: storageResponse.identifier,
    })
  })
})
