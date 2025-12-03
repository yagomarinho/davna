import { Left, Repository, Request, Right } from '@davna/core'
import { InMemoryRepository } from '@davna/repositories'

import { Session } from '../../entities/session'
import { verifySession as service } from '../../services/verify.session'
import { verifySessionHandler } from '../verify.session.handler'
import { makeConfig } from '../../fakes/make.config'

jest.mock('../../services/verify.session', () => ({
  verifySession: jest.fn(),
}))

const verifySession = service as any as jest.Mock

describe('verifySessionHandler', () => {
  const config = makeConfig()

  const tokenHeaderName = config.auth.jwt.token.headerName
  const refreshStrategy = 'rotate'
  const user_agent = 'Mozilla/5.0 (test)'
  const bearerToken = 'Bearer sometoken'
  const signature = 'sometoken'

  let sessions: Repository<Session>
  let signer: any

  beforeEach(() => {
    sessions = InMemoryRepository<Session>()

    signer = {
      sign: jest.fn(),
      decode: jest.fn(),
    }

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should throw an error if no bearer token is provided', async () => {
    const req = Request({
      data: {},
      metadata: {
        query: { refreshStrategy },
        headers: {
          'user-agent': user_agent,
        },
      },
    })

    const result = await verifySessionHandler(req)({ sessions, signer, config })

    expect(result).toBeDefined()
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

    expect(verifySession).not.toHaveBeenCalled()
  })

  it('should return 401 Response when verifySession returns Left', async () => {
    const req = Request({
      data: {},
      metadata: {
        query: { refreshStrategy },
        headers: {
          'user-agent': user_agent,
          [tokenHeaderName]: bearerToken,
        },
      },
    })

    verifySession.mockImplementationOnce(
      () => async () => Left({ message: 'invalid' }),
    )

    const result = await verifySessionHandler(req)({ sessions, signer, config })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: 'Invalid Session' }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 401 }),
        }),
      }),
    )

    expect(verifySession).toHaveBeenCalledTimes(1)
    const calledWith = verifySession.mock.calls[0][0]

    expect(calledWith).toEqual(
      expect.objectContaining({
        signature,
        user_agent,
        refresh_strategy: refreshStrategy,
      }),
    )
  })

  it('should return Response.data when verifySession returns Right', async () => {
    const req = Request({
      data: {},
      metadata: {
        query: { refreshStrategy },
        headers: {
          'user-agent': user_agent,
          [tokenHeaderName]: bearerToken,
        },
      },
    })

    const payload = {
      session: { id: 'sess-1' },
      account: { id: 'acc-1' },
    }

    verifySession.mockImplementationOnce(() => async () => Right(payload))

    const result = await verifySessionHandler(req)({ sessions, signer, config })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: payload,
      }),
    )

    expect(verifySession).toHaveBeenCalledTimes(1)

    const calledWith = verifySession.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({
        signature,
        user_agent,
        refresh_strategy: refreshStrategy,
      }),
    )
  })
})
