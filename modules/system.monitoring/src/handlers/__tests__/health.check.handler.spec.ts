import { Request, Right } from '@davna/core'
import { healthCheckHandler } from '../health.check.handler'
import { healthCheck as healthCheckService } from '../../services'

jest.mock('../../services', () => ({
  healthCheck: jest.fn(() => () => Right({ healthy: true })),
}))

const healthCheck = healthCheckService as any as jest.Mock

describe('health check service', () => {
  it('should be able to respond healthy', async () => {
    const req = Request.data()
    const result = await healthCheckHandler(req)({})

    expect(result.data).toEqual(expect.objectContaining({ healthy: true }))

    expect(healthCheck).toHaveBeenCalled()
  })
})
