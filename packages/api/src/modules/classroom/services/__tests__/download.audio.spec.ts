import { isLeft, isRight } from '../../../../shared/core/either'
import { InMemoryRepository } from '../../../../shared/repositories/in.memory.repository'
import { Audio, SUPORTED_MIME_TYPE } from '../../entities/audio'
import {
  STORAGE_TYPE,
  StorageConstructor,
} from '../../../../shared/providers/storage/storage'
import { downloadAudio } from '../download.audio'

describe('downloadAudio Service', () => {
  it('should return Left when audio is not found in repository', async () => {
    const audios = InMemoryRepository<Audio>()
    const downloadMock = jest.fn()
    const storage = (() => ({
      download: downloadMock,
    })) as any as StorageConstructor

    const result = await downloadAudio({
      audio_id: 'non-existent-audio',
    })({ storage, audios })

    expect(isLeft(result)).toBeTruthy()
    expect(result.value).toEqual({
      status: 'error',
      message: 'Audio not found',
    })
    expect(downloadMock).not.toHaveBeenCalled()
  })

  it('should return Left when storage.download does not return a buffer', async () => {
    const audios = InMemoryRepository<Audio>()

    const downloadMock = jest.fn().mockResolvedValue(null)
    const storage = (() => ({
      download: downloadMock,
    })) as unknown as StorageConstructor

    const audio = await audios.set(
      Audio.create({
        owner_id: 'owner-1',
        name: 'test-audio',
        mime: SUPORTED_MIME_TYPE.MP3,
        src: 'https://example.com/audio.mp3',
        duration: 2000,
        internal_ref: {
          storage: STORAGE_TYPE.MONGO_GRIDFS,
          identifier: 'file-123',
        },
      }),
    )

    const result = await downloadAudio({
      audio_id: audio.id as string,
    })({ storage, audios })

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
    const audios = InMemoryRepository<Audio>()

    const buffer = Buffer.from('audio-binary')
    const downloadMock = jest.fn().mockResolvedValue(buffer)
    const storage = (() => ({
      download: downloadMock,
    })) as unknown as StorageConstructor

    const audio = await audios.set(
      Audio.create({
        owner_id: 'owner-2',
        name: 'lesson-audio',
        mime: SUPORTED_MIME_TYPE.MP3,
        src: 'https://example.com/lesson.mp3',
        duration: 3000,
        internal_ref: {
          storage: STORAGE_TYPE.MONGO_GRIDFS,
          identifier: 'local-file-456',
        },
      }),
    )

    const result = await downloadAudio({
      audio_id: audio.id as string,
    })({ storage, audios })

    expect(isRight(result)).toBeTruthy()
    expect(downloadMock).toHaveBeenCalledTimes(1)
    expect(downloadMock).toHaveBeenCalledWith({
      identifier: 'local-file-456',
    })
  })

  it('should return Right with the downloaded buffer when everything is valid', async () => {
    const audios = InMemoryRepository<Audio>()

    const downloadedBuffer = Buffer.from('some-audio-content')
    const downloadMock = jest.fn().mockResolvedValue(downloadedBuffer)
    const storage = (() => ({
      download: downloadMock,
    })) as unknown as StorageConstructor

    const audio = await audios.set(
      Audio.create({
        owner_id: 'owner-3',
        name: 'practice-audio',
        mime: SUPORTED_MIME_TYPE.MP3,
        src: 'https://example.com/practice.mp3',
        duration: 1500,
        internal_ref: {
          storage: STORAGE_TYPE.MONGO_GRIDFS,
          identifier: 'practice-file-789',
        },
      }),
    )

    const result = await downloadAudio({
      audio_id: audio.id as string,
    })({ storage, audios })

    expect(isRight(result)).toBeTruthy()
    const buffer = (result.value as any).buffer

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.equals(downloadedBuffer)).toBe(true)
  })
})
