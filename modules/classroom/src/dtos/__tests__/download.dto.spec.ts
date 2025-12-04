import { isLeft, isRight } from '@davna/core'
import { downloadValidation } from '../download.audio.dto'

describe('downloadValidation', () => {
  it('should return Right and preserve params.id when provided', async () => {
    const request: any = {
      metadata: {
        params: { id: 'abc-123' },
      },
    }

    const result = await downloadValidation(request)

    expect(isRight(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('"id":"abc-123"')
    expect(result.value).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          params: expect.objectContaining({ id: 'abc-123' }),
        }),
      }),
    )
  })

  it('should return Left when params.id is missing', async () => {
    const request: any = {
      metadata: {
        params: {},
      },
    }

    const result = await downloadValidation(request)
    expect(isLeft(result)).toBeTruthy()
    const serialized = JSON.stringify(result)
    expect(serialized).toContain('id')
    expect(serialized).toContain('required')
  })

  it('should return Left when params.id is an empty string', async () => {
    const request: any = {
      metadata: {
        params: { id: '' },
      },
    }

    const result = await downloadValidation(request)
    expect(isLeft(result)).toBeTruthy()
    const serialized = JSON.stringify(result)
    expect(serialized).toContain('id')
    expect(serialized).toContain('required')
  })

  it('should return Left when metadata is completely missing', async () => {
    const request: any = {}

    const result = await downloadValidation(request)

    expect(isLeft(result)).toBeTruthy()
    const serialized = JSON.stringify(result)
    expect(serialized).toContain('params')
    expect(serialized).toContain('id')
  })
})
