import type { Signer } from '@davna/infra'
import { Left, Repository, Request, Right } from '@davna/core'
import { InMemoryRepository } from '@davna/infra'

import { Session } from '../../entities/session'
import { refreshSessionHandler } from '../refresh.session.handler'

import { refreshSession as service } from '../../services/refresh.session'
import { makeConfig } from '../../fakes/make.config'
import { Account } from '../../entities'

jest.mock('../../services/refresh.session', () => ({
  refreshSession: jest.fn(),
}))

const refreshSession = service as any as jest.Mock

describe('refreshSessionHandler', () => {
  const user_agent = 'Mozilla/5.0 (test)'

  let accounts: Repository<Account>
  let sessions: Repository<Session>
  let signer: jest.Mocked<Signer>
  const config = makeConfig()

  beforeEach(() => {
    accounts = InMemoryRepository<Account>()
    sessions = InMemoryRepository<Session>()

    signer = {
      sign: jest.fn(),
      decode: jest.fn(),
    } as unknown as jest.Mocked<Signer>

    jest.clearAllMocks()
  })

  it('should throw when refresh bearer header is missing', async () => {
    const req = Request.metadata({
      headers: {},
    })
    const result = await refreshSessionHandler(req)({
      accounts,
      sessions,
      signer,
      config,
    })

    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          message: 'Not Authorized. JWT is Missing',
        }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 401 }),
        }),
      }),
    )
  })

  it('should return 401 Response when tokenFromBearer throws (invalid bearer)', async () => {
    const bearer = 'invalid-bearer'
    const req = Request({
      data: {},
      metadata: {
        headers: {
          'user-agent': user_agent,
          'x-refresh-authorization': bearer,
        },
      },
    })

    const result = await refreshSessionHandler(req)({
      accounts,
      sessions,
      signer,
      config,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          message: 'Not Authorized. Invalid Token',
        }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 401 }),
        }),
      }),
    )
  })

  it('should return 401 Response when refreshSession service returns Left', async () => {
    const bearer = 'Bearer sig-123'
    const signature = 'sig-123'
    const req = Request({
      data: {},
      metadata: {
        headers: {
          'user-agent': user_agent,
          'x-refresh-authorization': bearer,
        },
      },
    })

    refreshSession.mockImplementationOnce(
      () => async () => Left({ status: 'error', message: 'Invalid' }),
    )

    const result = await refreshSessionHandler(req)({
      accounts,
      sessions,
      signer,
      config,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: 'Invalid Session' }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 401 }),
        }),
      }),
    )

    const calledWith = refreshSession.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({ signature, user_agent }),
    )
  })

  it('should return Response.data with payload when refreshSession service returns Right', async () => {
    const bearer = 'Bearer sig-456'
    const signature = 'sig-456'
    const req = Request({
      data: {},
      metadata: {
        headers: {
          'user-agent': user_agent,
          'x-refresh-authorization': bearer,
        },
      },
    })

    const servicePayload = {
      token: { value: 'new-access' },
      refresh_token: { value: 'new-refresh' },
    }

    refreshSession.mockImplementationOnce(
      () => async () => Right(servicePayload),
    )

    const result = await refreshSessionHandler(req)({
      accounts,
      sessions,
      signer,
      config,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: servicePayload,
      }),
    )

    const calledWith = refreshSession.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({ signature, user_agent }),
    )
  })
})
