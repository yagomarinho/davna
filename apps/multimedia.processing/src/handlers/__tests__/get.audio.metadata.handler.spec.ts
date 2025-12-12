import { Request } from '@davna/core'
import { getAudioMetadataHandler } from '../get.audio.metadata.handler'
import { resolve } from 'node:path'

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn(),
  rm: jest.fn(),
}))

const { writeFile, rm } = jest.requireMock('node:fs/promises') as {
  writeFile: jest.Mock
  rm: jest.Mock
}

describe('getAudioMetadataHandler (integration points)', () => {
  const tempDir = resolve(__dirname, '../../../temp')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should write temp file, call provider and return metadata on success', async () => {
    const file = {
      buffer: Buffer.from('buffer write test'),
      originalname: 'fake.audio',
      mimetype: 'audio/mp3',
    }

    const req = Request.metadata({
      file,
    })

    const expectedMetadata = {
      duration: 16.212,
      format: 'mp4',
      codec: 'aac',
    }

    const audioMetadata = {
      getMetadata: jest.fn().mockResolvedValue(expectedMetadata),
    }

    const result = await getAudioMetadataHandler(req)({
      audioMetadata: audioMetadata as any,
      config: { tempDir },
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          name: file.originalname,
          mime: file.mimetype,
          duration: expectedMetadata.duration,
          format: expectedMetadata.format,
          codec: expectedMetadata.codec,
        }),
      }),
    )

    const expectedTempName = `tmp-${file.originalname}.mp3`
    const expectedPath = resolve(tempDir, expectedTempName)

    expect(writeFile).toHaveBeenCalledTimes(1)
    expect(writeFile).toHaveBeenCalledWith(expectedPath, file.buffer, {
      flag: 'w',
    })

    expect(audioMetadata.getMetadata).toHaveBeenCalledTimes(1)
    expect(audioMetadata.getMetadata).toHaveBeenCalledWith(expectedPath)

    expect(rm).toHaveBeenCalledTimes(1)
    expect(rm).toHaveBeenCalledWith(expectedPath)
  })

  it('should return 400 response when provider throws (invalid audio)', async () => {
    const file = {
      buffer: Buffer.from('not an audio'),
      originalname: 'bad.file',
      mimetype: 'application/octet-stream',
    }

    const req = Request.metadata({
      file,
    })

    const audioMetadata = {
      getMetadata: jest.fn().mockRejectedValue(new Error('ffprobe error')),
    }

    const result = await getAudioMetadataHandler(req)({
      audioMetadata: audioMetadata as any,
      config: { tempDir },
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: 'Invalid Audio File Type' }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 400 }),
        }),
      }),
    )

    const expectedTempName = `tmp-${file.originalname}.octet-stream`
    const expectedPath = resolve(tempDir, expectedTempName)

    expect(writeFile).toHaveBeenCalledTimes(1)
    expect(writeFile).toHaveBeenCalledWith(expectedPath, file.buffer, {
      flag: 'w',
    })

    expect(audioMetadata.getMetadata).toHaveBeenCalledTimes(1)
    expect(audioMetadata.getMetadata).toHaveBeenCalledWith(expectedPath)

    expect(rm).toHaveBeenCalledTimes(1)
    expect(rm).toHaveBeenCalledWith(expectedPath)
  })
})
