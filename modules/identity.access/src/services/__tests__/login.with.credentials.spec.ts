import { isLeft, isRight, Repository } from '@davna/core'
import { InMemoryRepository, type Auth, type Signer } from '@davna/infra'

import { Account, createAccount } from '../../entities/account'
import { Session } from '../../entities/session'
import { loginWithCredentials } from '../login.with.credentials'

import { makeConfig } from '../../fakes/make.config'

describe('login with credentials service', () => {
  const signer: Signer = {
    sign: jest.fn(),
    decode: jest.fn(),
  }

  const auth: Auth = {
    authenticate: jest.fn(),
    getUser: jest.fn(),
  }

  const config = makeConfig()

  let accounts: Repository<Account>
  let sessions: Repository<Session>

  beforeEach(() => {
    accounts = InMemoryRepository<Account>()
    sessions = InMemoryRepository<Session>()

    jest.clearAllMocks()
  })

  it('should be able to login with right credentials and create a new account in the process', async () => {
    const expected = { token: 'token', refresh_token: 'refresh_token' }

    const credentials = {
      email: 'john@doe.com',
      password: '1234',
      user_agent: 'device',
      idempotency_key: 'idempotent',
    }

    ;(signer.sign as jest.Mock).mockReturnValue(expected.token)
    ;(signer.sign as jest.Mock).mockReturnValueOnce(expected.refresh_token)
    ;(auth.authenticate as jest.Mock).mockReturnValue({
      id: 'external_ref',
      name: 'john',
    })

    const result = await loginWithCredentials(credentials)({
      signer,
      auth,
      accounts,
      sessions,
      config,
    })

    expect(isRight(result)).toBeTruthy()

    const data = result.value

    expect(data).toEqual({
      account: expect.objectContaining({
        props: {
          external_ref: 'external_ref',
          name: 'john',
          roles: expect.any(Array),
        },
        meta: {
          id: expect.any(String),
          _r: 'entity',
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
          _idempotency_key: 'idempotent',
        },
      }),
      token: {
        value: expected.token,
        expiresIn: expect.any(Number),
      },
      refresh_token: {
        value: expected.refresh_token,
        expiresIn: expect.any(Number),
      },
    })
  })

  it('should be able to login with right credentials and not create a account with same external_ref', async () => {
    const expected = { token: 'token', refresh_token: 'refresh_token' }

    const credentials = {
      email: 'john@doe.com',
      password: '1234',
      user_agent: 'device',
      idempotency_key: 'idempotent',
    }

    const external_ref = 'external_ref'

    ;(signer.sign as jest.Mock).mockReturnValue(expected.token)
    ;(signer.sign as jest.Mock).mockReturnValueOnce(expected.refresh_token)
    ;(auth.authenticate as jest.Mock).mockReturnValue({
      id: external_ref,
      name: 'john',
    })

    const account = await accounts.methods.set(
      createAccount({ external_ref, name: 'john', roles: [] }),
    )

    const result = await loginWithCredentials(credentials)({
      signer,
      auth,
      accounts,
      sessions,
      config,
    })

    expect(isRight(result)).toBeTruthy()

    const data = result.value

    expect(data).toEqual({
      account,
      token: {
        value: expected.token,
        expiresIn: expect.any(Number),
      },
      refresh_token: {
        value: expected.refresh_token,
        expiresIn: expect.any(Number),
      },
    })

    const all = await accounts.methods.query()

    expect(all.length).toBe(1)
  })

  it('should not be able to login with wrong credentials', async () => {
    const credentials = {
      email: 'john@doe.com',
      password: '1234',
      user_agent: 'device',
      idempotency_key: 'idempotent',
    }

    const result = await loginWithCredentials(credentials)({
      signer,
      auth: {
        ...auth,
        authenticate: () => {
          throw new Error('Invalid Credentials')
        },
      },
      accounts,
      sessions,
      config,
    })

    expect(isLeft(result)).toBeTruthy()
  })

  it('should not be able to login with same idempotency key twice', async () => {
    const expected = { token: 'token', refresh_token: 'refresh_token' }

    const credentials = {
      email: 'john@doe.com',
      password: '1234',
      user_agent: 'device',
      idempotency_key: 'idempotent',
    }

    ;(signer.sign as jest.Mock).mockReturnValue(expected.token)
    ;(signer.sign as jest.Mock).mockReturnValueOnce(expected.refresh_token)
    ;(auth.authenticate as jest.Mock).mockReturnValue({
      id: 'external_ref',
      name: 'john',
    })

    const resultRight = await loginWithCredentials(credentials)({
      signer,
      auth,
      accounts,
      sessions,
      config,
    })

    expect(isRight(resultRight)).toBeTruthy()

    const resultLeft = await loginWithCredentials(credentials)({
      signer,
      auth,
      accounts,
      sessions,
      config,
    })

    expect(isLeft(resultLeft)).toBeTruthy()
    expect(JSON.stringify(resultLeft.value)).toContain('Already done')
  })
})
