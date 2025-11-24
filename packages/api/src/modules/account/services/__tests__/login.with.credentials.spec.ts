import { isLeft, isRight } from '../../../../shared/core/either'
import { Repository } from '../../../../shared/core/repository'
import { InMemoryRepository } from '../../../../shared/repositories/in.memory.repository'
import { Account } from '../../entities/account'
import { Session } from '../../entities/session'
import { Auth } from '../../helpers/auth'
import { Signer } from '../../helpers/signer'
import { loginWithCredentials } from '../login.with.credentials'

describe('login with credentials service', () => {
  const signer: Signer = {
    sign: jest.fn(),
    decode: jest.fn(),
  }

  const auth: Auth = {
    authenticate: jest.fn(),
    getUser: jest.fn(),
  }

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
    })

    expect(isRight(result)).toBeTruthy()

    const data = result.value

    expect(data).toEqual({
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
    }

    const external_ref = 'external_ref'

    ;(signer.sign as jest.Mock).mockReturnValue(expected.token)
    ;(signer.sign as jest.Mock).mockReturnValueOnce(expected.refresh_token)
    ;(auth.authenticate as jest.Mock).mockReturnValue({
      id: external_ref,
      name: 'john',
    })

    accounts.set(Account.create({ external_ref, name: 'john' }))

    const result = await loginWithCredentials(credentials)({
      signer,
      auth,
      accounts,
      sessions,
    })

    expect(isRight(result)).toBeTruthy()

    const data = result.value

    expect(data).toEqual({
      token: {
        value: expected.token,
        expiresIn: expect.any(Number),
      },
      refresh_token: {
        value: expected.refresh_token,
        expiresIn: expect.any(Number),
      },
    })

    const all = await accounts.query()

    expect(all.length).toBe(1)
  })

  it('should not be able to login with wrong credentials', async () => {
    const credentials = {
      email: 'john@doe.com',
      password: '1234',
      user_agent: 'device',
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
    })

    expect(isLeft(result)).toBeTruthy()
  })
})
