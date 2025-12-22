import { isLeft, isRight, Left, Repository } from '@davna/core'
import { InMemoryRepository, type Signer } from '@davna/infra'

import { Account, createAccount, createSession, Session } from '../../entities'
import { getSessionInfo } from '../../services/get.session.info'

describe('getSessionInfo service', () => {
  const token = 'token-value'
  const session_id = 'session-1'
  const account_id = 'account-1'

  let signer: jest.Mocked<Signer>
  let sessionsRepo: Repository<Session>
  let accountsRepo: Repository<Account>

  beforeEach(() => {
    signer = {
      sign: jest.fn(),
      decode: jest.fn(),
    } as unknown as jest.Mocked<Signer>

    sessionsRepo = InMemoryRepository<Session>()
    accountsRepo = InMemoryRepository<Account>()

    jest.clearAllMocks()
  })

  it('should return Right with account and session when session and account exist', async () => {
    const session = createSession(
      {
        account_id,
        expiresIn: new Date(Date.now() + 1000 * 60 * 60),
        refresh_token: 'refresh-token-value',
        user_agent: 'unit-test-agent',
      },
      {
        id: session_id,
        _r: 'entity',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      },
    )
    const account = createAccount(
      { name: 'john', external_ref: 'external_ref', roles: [] },
      {
        id: account_id,
        _r: 'entity',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      },
    )

    await sessionsRepo.methods.set(session)
    await accountsRepo.methods.set(account)
    ;(signer.decode as jest.Mock).mockReturnValue({ subject: session_id })

    const result = await getSessionInfo(token)({
      signer,
      sessions: sessionsRepo,
      accounts: accountsRepo,
    })

    expect(isRight(result)).toBeTruthy()
    expect(result.value).toEqual(expect.objectContaining({ account, session }))
  })

  it('should return Left when session is not found', async () => {
    ;(signer.decode as jest.Mock).mockReturnValue({ subject: session_id })

    const result = await getSessionInfo(token)({
      signer,
      sessions: sessionsRepo,
      accounts: accountsRepo,
    })

    expect(isLeft(result)).toBeTruthy()
    expect(result).toEqual(
      expect.objectContaining(
        Left({ status: 'error', message: 'No session founded' } as any),
      ),
    )
  })

  it('should return Left when account is not found', async () => {
    const session = createSession(
      {
        account_id,
        expiresIn: new Date(Date.now() + 1000 * 60 * 60),
        refresh_token: 'refresh-token-value',
        user_agent: 'unit-test-agent',
      },
      {
        id: session_id,
        _r: 'entity',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      },
    )
    await sessionsRepo.methods.set(session)
    // accountsRepo remains empty
    ;(signer.decode as jest.Mock).mockReturnValue({ subject: session_id })

    const result = await getSessionInfo(token)({
      signer,
      sessions: sessionsRepo,
      accounts: accountsRepo,
    })

    expect(isLeft(result)).toBeTruthy()
    expect(result).toEqual(
      expect.objectContaining(
        Left({ status: 'error', message: 'No account founded' } as any),
      ),
    )
  })

  it('should return Left when signer.decode throws', async () => {
    ;(signer.decode as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token')
    })

    const result = await getSessionInfo(token)({
      signer,
      sessions: sessionsRepo,
      accounts: accountsRepo,
    })

    expect(isLeft(result)).toBeTruthy()
    expect(result).toEqual(
      expect.objectContaining(
        Left({ status: 'error', message: 'invalid token' } as any),
      ),
    )
  })
})
