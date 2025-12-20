import { isLeft, isRight } from '@davna/core'
import { refreshValidation } from '../refresh.dto'

describe('refreshValidation', () => {
  const refreshTokenHeader = 'x-refresh-token'
  const validate = refreshValidation({ refreshTokenHeader })

  it('should return Right and apply defaults when metadata has only idempotency_key', async () => {
    const request: any = {
      metadata: { headers: { 'x-idempotency-key': 'idempotent' } },
    }

    const result = await validate(request)

    expect(isRight(result)).toBeTruthy()

    const serialized = JSON.stringify(result)

    expect(serialized).toContain('"user-agent":"anonymous"')
    expect(serialized).toContain(`"${refreshTokenHeader}":""`)
  })

  it('should accept provided headers and preserve values', async () => {
    const request: any = {
      metadata: {
        headers: {
          'user-agent': 'custom-agent',
          [refreshTokenHeader]: 'rt-123',
          'x-idempotency-key': 'idempotent',
        },
      },
    }

    const result = await validate(request)

    expect(isRight(result)).toBeTruthy()

    const serialized = JSON.stringify(result)
    expect(serialized).toContain(`"user-agent":"custom-agent"`)
    expect(serialized).toContain(`"${refreshTokenHeader}":"rt-123"`)
  })

  it('should return Left when request has no metadata key', async () => {
    const request: any = {}

    const result = await validate(request)

    expect(isLeft(result)).toBeTruthy()
  })
})
