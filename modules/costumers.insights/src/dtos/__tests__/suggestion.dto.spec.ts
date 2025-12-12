import { isLeft, isRight } from '@davna/core'
import { suggestionValidate } from '../suggestion.dto'

describe('suggestionValidate', () => {
  it('should return Right and preserve suggestion when data is valid', async () => {
    const request: any = {
      data: { suggestion: 'this is a suggestion' },
    }

    const result = await suggestionValidate(request)

    expect(isRight(result)).toBeTruthy()

    expect(JSON.stringify(result)).toContain(
      '"suggestion":"this is a suggestion"',
    )

    expect(result.value).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ suggestion: 'this is a suggestion' }),
      }),
    )
  })

  it('should return Left when data is missing entirely', async () => {
    const request: any = {}

    const result = await suggestionValidate(request)

    expect(isLeft(result)).toBeTruthy()

    const serialized = JSON.stringify(result)

    expect(serialized).toContain('suggestion')
  })

  it('should return Left when suggestion is missing from data', async () => {
    const request: any = {
      data: {},
    }

    const result = await suggestionValidate(request)

    expect(isLeft(result)).toBeTruthy()

    const serialized = JSON.stringify(result)
    expect(serialized).toContain('suggestion')
    expect(serialized).toContain('required')
  })

  it('should return Left when suggestion is an empty string', async () => {
    const request: any = {
      data: { suggestion: '' },
    }

    const result = await suggestionValidate(request)

    expect(isLeft(result)).toBeTruthy()

    const serialized = JSON.stringify(result)

    expect(serialized).toContain('suggestion')
  })

  it('should ignore extra fields and only validate required shape', async () => {
    const request: any = {
      data: { suggestion: 'This is a suggestion', extra: 'ignored' },
    }

    const result = await suggestionValidate(request)

    expect(isRight(result)).toBeTruthy()

    expect(JSON.stringify(result)).toContain(
      '"suggestion":"This is a suggestion"',
    )
  })
})
