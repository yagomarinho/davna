import { isRight } from '@davna/core'
import { healthCheck } from '../health.check'

describe('health check service', () => {
  it('should be able to respond healthy', async () => {
    const result = await healthCheck()({})

    expect(isRight(result)).toBeTruthy()

    expect(result.value).toEqual(expect.objectContaining({ healthy: true }))
  })
})
