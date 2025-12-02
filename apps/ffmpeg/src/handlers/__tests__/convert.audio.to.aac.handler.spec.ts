import { Request } from '@davna/core'
import { resolve } from 'node:path'
import { convertAudioToAACtaHandler } from '../convert.audio.to.aac.handler'

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn(),
  rm: jest.fn(),
}))

const { writeFile, rm } = jest.requireMock('node:fs/promises') as {
  writeFile: jest.Mock
  rm: jest.Mock
}

describe('convertAudioToAACtaHandler (integration points)', () => {
  const tempDir = resolve(__dirname, '../../../temp')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should write temp file, call provider.convertAudioToAAC and return converted metadata on success', async () => {
    const file = {
      buffer: Buffer.from('audio buffer'),
      originalname: 'song.track',
      mimetype: 'audio/aac',
    }

    const req = Request.metadata({
      file,
    })

    const expectedConversion = {
      duration: 32.5,
      format: 'aac',
      codec: 'aac-lc',
    }

    const audioMetadata = {
      convertAudioToAAC: jest.fn().mockResolvedValue(expectedConversion),
    }

    const result = await convertAudioToAACtaHandler(req)({
      audioMetadata: audioMetadata as any,
      config: { tempDir },
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          name: file.originalname,
          mime: file.mimetype,
          duration: expectedConversion.duration,
          format: expectedConversion.format,
          codec: expectedConversion.codec,
        }),
      }),
    )

    const expectedTempName = `${file.originalname}.aac`
    const expectedPath = resolve(tempDir, expectedTempName)

    expect(writeFile).toHaveBeenCalledTimes(1)
    expect(writeFile).toHaveBeenCalledWith(expectedPath, file.buffer, {
      flag: 'w',
    })

    expect(audioMetadata.convertAudioToAAC).toHaveBeenCalledTimes(1)
    expect(audioMetadata.convertAudioToAAC).toHaveBeenCalledWith(expectedPath, {
      mime: file.mimetype,
      filename: 'output',
    })

    expect(rm).toHaveBeenCalledTimes(1)
    expect(rm).toHaveBeenCalledWith(expectedPath)
  })

  it('should return 400 response when provider.convertAudioToAAC throws and still remove temp file', async () => {
    const file = {
      buffer: Buffer.from('bad audio'),
      originalname: 'broken.track',
      mimetype: 'application/octet-stream',
    }

    const req = Request.metadata({
      file,
    })

    const audioMetadata = {
      convertAudioToAAC: jest
        .fn()
        .mockRejectedValue(new Error('conversion error')),
    }

    const result = await convertAudioToAACtaHandler(req)({
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

    const expectedTempName = `${file.originalname}.octet-stream`
    const expectedPath = resolve(tempDir, expectedTempName)

    expect(writeFile).toHaveBeenCalledTimes(1)
    expect(writeFile).toHaveBeenCalledWith(expectedPath, file.buffer, {
      flag: 'w',
    })

    expect(audioMetadata.convertAudioToAAC).toHaveBeenCalledTimes(1)
    expect(audioMetadata.convertAudioToAAC).toHaveBeenCalledWith(expectedPath, {
      mime: file.mimetype,
      filename: 'output',
    })

    expect(rm).toHaveBeenCalledTimes(1)
    expect(rm).toHaveBeenCalledWith(expectedPath)
  })
})
