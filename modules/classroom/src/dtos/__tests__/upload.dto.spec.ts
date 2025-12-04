import { isLeft, isRight } from '@davna/core'
import { uploadValidation } from '../upload.audio.dto'
import { SUPORTED_MIME_TYPE } from '../../entities'

describe('uploadValidation', () => {
  const validMime = SUPORTED_MIME_TYPE.MP4

  it('should return Right and preserve buffer, originalname and mimetype when metadata is valid', async () => {
    const request: any = {
      metadata: {
        file: {
          buffer: Buffer.from('file-content'),
          originalname: 'avatar.png',
          mimetype: validMime,
        },
      },
    }

    const result = await uploadValidation(request)

    expect(isRight(result)).toBeTruthy()

    expect(result.value).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          file: expect.objectContaining({
            originalname: 'avatar.png',
            mimetype: validMime,
          }),
        }),
      }),
    )

    expect(
      Buffer.isBuffer((result.value as any).metadata.file.buffer),
    ).toBeTruthy()
  })

  it('should return Left when file.buffer is not a Buffer', async () => {
    const request: any = {
      metadata: {
        file: {
          buffer: 'not-a-buffer',
          originalname: 'avatar.png',
          mimetype: validMime,
        },
      },
    }

    const result = await uploadValidation(request)

    expect(isLeft(result)).toBeTruthy()

    const serialized = JSON.stringify(result)
    expect(serialized).toContain('Value must be a Buffer')
  })

  it('should return Left when required file fields are missing', async () => {
    const request: any = {
      metadata: {
        file: {},
      },
    }

    const result = await uploadValidation(request)

    expect(isLeft(result)).toBeTruthy()

    const serialized = JSON.stringify(result)
    expect(serialized).toContain('originalname')
    expect(serialized).toContain('mimetype')
    expect(serialized).toContain('buffer')
  })

  it('should return Left when mimetype is not supported', async () => {
    const request: any = {
      metadata: {
        file: {
          buffer: Buffer.from('x'),
          originalname: 'badfile.bin',
          mimetype: 'application/unsupported',
        },
      },
    }

    const result = await uploadValidation(request)

    expect(isLeft(result)).toBeTruthy()
    const serialized = JSON.stringify(result)
    expect(serialized).toContain('mimetype')
  })
})
