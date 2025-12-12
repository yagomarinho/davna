import { isLeft, isRight } from '@davna/core'
import { verifyValidation } from '../verify.dto'
import { REFRESH_STRATEGY } from '../../services/verify.session'

describe('verifyValidation', () => {
  const tokenHeader = 'x-token'

  it('should return Right and apply defaults when metadata is empty', async () => {
    const validate = verifyValidation({ tokenHeader })

    const request: any = { metadata: {} }

    const result = await validate(request)

    expect(isRight(result)).toBeTruthy()

    const serialized = JSON.stringify(result)

    expect(serialized).toContain('"user-agent":"anonymous"')
    expect(serialized).toContain(`"${tokenHeader}":""`)
    expect(serialized).toContain(`"refreshStrategy":"${REFRESH_STRATEGY.LAX}"`)
  })

  it('should accept a valid refreshStrategy and provided headers', async () => {
    const validate = verifyValidation({ tokenHeader })

    const request: any = {
      metadata: {
        query: { refreshStrategy: REFRESH_STRATEGY.NEVER },
        headers: { 'user-agent': 'my-agent', [tokenHeader]: 'my-token' },
      },
    }

    const result = await validate(request)

    expect(isRight(result)).toBeTruthy()

    const serialized = JSON.stringify(result)

    expect(serialized).toContain(
      `"refreshStrategy":"${REFRESH_STRATEGY.NEVER}"`,
    )
    expect(serialized).toContain(`"user-agent":"my-agent"`)
    expect(serialized).toContain(`"${tokenHeader}":"my-token"`)
  })

  it('should return Left when refreshStrategy is invalid', async () => {
    const validate = verifyValidation({ tokenHeader })

    const request: any = {
      metadata: {
        query: { refreshStrategy: 'invalid-value' },
        headers: { 'user-agent': 'agent' },
      },
    }

    const result = await validate(request)

    expect(isLeft(result)).toBeTruthy()

    expect(JSON.stringify(result)).toContain('refreshStrategy')
  })

  it('should return Right when request has no metadata (apply all defaults)', async () => {
    const validate = verifyValidation({ tokenHeader })

    const request: any = {}

    const result = await validate(request)

    expect(isRight(result)).toBeTruthy()

    const serialized = JSON.stringify(result)

    expect(serialized).toContain('"user-agent":"anonymous"')
    expect(serialized).toContain(`"${tokenHeader}":""`)
    expect(serialized).toContain(`"refreshStrategy":"${REFRESH_STRATEGY.LAX}"`)
  })
})
