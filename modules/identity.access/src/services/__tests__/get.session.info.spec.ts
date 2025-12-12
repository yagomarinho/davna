import type { Signer } from '@davna/providers'
import { isLeft, isRight, Left, Right, Repository } from '@davna/core'
import { InMemoryRepository } from '@davna/repositories'

import { Account, Session } from '../../entities'
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
    const session = { id: session_id, account_id } as unknown as Session
    const account = { id: account_id, name: 'john' } as unknown as Account

    await sessionsRepo.set(session)
    await accountsRepo.set(account)
    ;(signer.decode as jest.Mock).mockReturnValue({ subject: session_id })

    const result = await getSessionInfo(token)({
      signer,
      sessions: sessionsRepo,
      accounts: accountsRepo,
    })

    expect(isRight(result)).toBeTruthy()
    expect(result).toEqual(
      expect.objectContaining(
        Right({
          account,
          session,
        } as any),
      ),
    )
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
    const session = { id: session_id, account_id } as unknown as Session
    await sessionsRepo.set(session)
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
