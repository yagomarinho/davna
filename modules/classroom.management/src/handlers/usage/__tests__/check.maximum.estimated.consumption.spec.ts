import {
  Request,
  Left,
  Right,
  AuthContext,
  createAuthContext,
} from '@davna/core'

import {
  authorizeConsumption,
  getParticipantBySubjectId,
} from '../../../services'
import { COUNT_UNITS } from '../../../entities'
import { checkMaxEstimatedConsumptionHandler } from '../check.maximum.estimated.consumption.handler'

jest.mock('../../../services')

describe('check max estimated consumption handler', () => {
  const repository = {} as any
  const account_id = 'account-1'

  const metadata: { auth: AuthContext } = {
    auth: createAuthContext({ id: account_id }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when account participant is not found', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'not found',
        }),
      ),
    )

    const result = await checkMaxEstimatedConsumptionHandler(
      Request({
        data: { usage_unit: COUNT_UNITS.TKS },
        metadata,
      }),
    )({ repository })

    expect(result.metadata?.headers?.status).toBe(401)
    expect(result.data).toEqual({
      message: 'Invalid account id',
    })
  })

  it('should return 403 when consumption is not authorized', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Right({
          meta: { id: 'participant-1' },
        }),
      ),
    )
    ;(authorizeConsumption as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'limit exceeded',
        }),
      ),
    )

    const result = await checkMaxEstimatedConsumptionHandler(
      Request({
        data: { usage_unit: COUNT_UNITS.TKS },
        metadata,
      }),
    )({ repository })

    expect(result.metadata?.headers?.status).toBe(403)
    expect(result.data).toEqual({
      message: 'Consumption limit exceeded.. Try again later',
    })
  })

  it('should return 500 when no consumption policies are found', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Right({
          meta: { id: 'participant-1' },
        }),
      ),
    )
    ;(authorizeConsumption as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right([])),
    )

    const result = await checkMaxEstimatedConsumptionHandler(
      Request({
        data: { usage_unit: COUNT_UNITS.TKS },
        metadata,
      }),
    )({ repository })

    expect(result.metadata?.headers?.status).toBe(500)
    expect(result.data).toEqual({
      message: 'No consumption policies found',
    })
  })

  it('should return the most restrictive consumption policy', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Right({
          meta: { id: 'participant-1' },
        }),
      ),
    )
    ;(authorizeConsumption as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Right([
          {
            policy: {
              aggregation: 'daily',
              unit: COUNT_UNITS.TKS,
              maxConsumption: 1000,
            },
            consumption: {
              value: 200,
            },
          },
          {
            policy: {
              aggregation: 'monthly',
              unit: COUNT_UNITS.TKS,
              maxConsumption: 500,
            },
            consumption: {
              value: 450,
            },
          },
        ]),
      ),
    )

    const result = await checkMaxEstimatedConsumptionHandler(
      Request({
        data: { usage_unit: COUNT_UNITS.TKS },
        metadata,
      }),
    )({ repository })

    expect(result.data).toEqual({
      consumption: {
        aggregation: 'monthly',
        unit: COUNT_UNITS.TKS,
        totalUsed: 450,
        maxConsumption: 500,
        remainingConsumption: 50,
      },
    })
  })
})
