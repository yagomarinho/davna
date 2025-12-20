import { Left, Repository, Request } from '@davna/core'
import { InMemoryRepository, type Auth, type Signer } from '@davna/infra'

import { Account } from '../../entities/account'
import { Session } from '../../entities/session'

import { loginWithCredentials as service } from '../../services/login.with.credentials'
import { loginWithCredentialsHandler } from '../login.with.credentials.handler'

import { makeConfig } from '../../fakes/make.config'

jest.mock('../../services/login.with.credentials', () => ({
  loginWithCredentials: jest.fn(),
}))

const loginWithCredentials = service as any as jest.Mock

describe('loginWithCredentialsHandler', () => {
  const email = 'user@example.com'
  const password = 'secret'
  const user_agent = 'Mozilla/5.0 (test)'

  let accounts: Repository<Account>
  let sessions: Repository<Session>
  let auth: jest.Mocked<Auth>
  let signer: jest.Mocked<Signer>
  const config = makeConfig()

  beforeEach(() => {
    accounts = InMemoryRepository<Account>()
    sessions = InMemoryRepository<Session>()

    auth = {
      compare: jest.fn(),
      hash: jest.fn(),
    } as unknown as jest.Mocked<Auth>

    signer = {
      sign: jest.fn(),
      decode: jest.fn(),
    } as unknown as jest.Mocked<Signer>

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 Response when loginWithCredentials service returns Left (unauthorized)', async () => {
    const req = Request({
      data: { email, password },
      metadata: {
        headers: {
          'user-agent': user_agent,
          'x-idempotency-key': 'idempotent',
        },
      },
    })

    loginWithCredentials.mockImplementationOnce(
      () => async () => Left({ status: 'error', message: 'Unauthorized' }),
    )

    const result = await loginWithCredentialsHandler(req)({
      accounts,
      sessions,
      auth,
      signer,
      config,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: 'Unauthorized to login' }),
        metadata: expect.objectContaining({ headers: { status: 401 } }),
      }),
    )

    expect(loginWithCredentials).toHaveBeenCalledTimes(1)
    const calledWith = loginWithCredentials.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({ email, password, user_agent }),
    )
  })

  it('should return Response.data with payload when loginWithCredentials service returns Right', async () => {
    const req = Request({
      data: { email, password },
      metadata: {
        headers: {
          'user-agent': user_agent,
          'x-idempotency-key': 'idempotent',
        },
      },
    })

    const servicePayload = {
      token: { value: 'access-token' },
      refresh_token: { value: 'refresh-token' },
      account: { id: 'acc-1', email },
    }

    loginWithCredentials.mockImplementationOnce(() => async () => ({
      isLeft: false,
      value: servicePayload,
    }))

    const result = await loginWithCredentialsHandler(req)({
      accounts,
      sessions,
      auth,
      signer,
      config,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: servicePayload,
      }),
    )

    expect(loginWithCredentials).toHaveBeenCalledTimes(1)
    const calledWith = loginWithCredentials.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({ email, password, user_agent }),
    )
  })
})
