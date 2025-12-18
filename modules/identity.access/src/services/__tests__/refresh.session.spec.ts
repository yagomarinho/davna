import { isLeft, isRight, QueryBuilder, Repository } from '@davna/core'
import { InMemoryRepository, type Signer } from '@davna/infra'

import { createSession, Session } from '../../entities/session'
import { refreshSession } from '../refresh.session'

import { makeConfig } from '../../fakes/make.config'
import { Account, createAccount } from '../../entities'

const dayTime = 24 * 60 * 60 * 1000

describe('refresh session service', () => {
  const account_id = 'account.id'
  const refresh_signature = 'refresh.signature'
  const user_agent = 'Mozilla/5.0'

  let signer: jest.Mocked<Signer>
  let accounts: Repository<Account>
  let sessions: Repository<Session>
  const config = makeConfig()

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-11-07T12:00:00Z'))

    accounts = InMemoryRepository<Account>()
    sessions = InMemoryRepository<Session>()
    signer = {
      sign: jest.fn(),
      decode: jest.fn(),
    }
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('should return Left when no session matches the refresh signature', async () => {
    const result = await refreshSession({
      signature: refresh_signature,
      user_agent,
    })({ signer, sessions, accounts, config })

    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Invalid Signature')
  })

  it('should return Left and remove the session when the matched session is expired', async () => {
    let expired = createSession({
      account_id,
      user_agent,
      refresh_token: refresh_signature,
      expiresIn: new Date(Date.now() - dayTime),
    })

    expired = await sessions.methods.set(expired)

    const removeSpy = jest.spyOn(sessions.methods, 'remove')

    const result = await refreshSession({
      signature: refresh_signature,
      user_agent,
    })({ signer, accounts, sessions, config })

    expect(removeSpy).toHaveBeenCalledWith(expired.meta!.id)
    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Invalid Signature')
  })

  it('should return Left and remove the session when the matched account with session account.id', async () => {
    let expired = createSession({
      account_id,
      user_agent,
      refresh_token: refresh_signature,
      expiresIn: new Date(Date.now() + 2000),
    })

    expired = await sessions.methods.set(expired)

    const removeSpy = jest.spyOn(sessions.methods, 'remove')

    const result = await refreshSession({
      signature: refresh_signature,
      user_agent,
    })({ signer, accounts, sessions, config })

    expect(removeSpy).toHaveBeenCalledWith(expired.meta!.id)
    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Invalid Account Session')
  })

  it('should reuse the existing refresh token when more than 24h remains (no session update)', async () => {
    const stable_refresh = refresh_signature
    let session = createSession({
      account_id,
      user_agent: 'Old-UA',
      refresh_token: stable_refresh,
      expiresIn: new Date(Date.now() + 3 * dayTime),
    })
    session = await sessions.methods.set(session)

    const account = await accounts.methods.set(
      createAccount(
        {
          name: 'john',
          external_ref: 'external_ref',
          roles: [],
        },
        {
          id: account_id,
          _r: 'entity',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ),
    )

    const querySpy = jest.spyOn(sessions.methods, 'query')
    const setSpy = jest.spyOn(sessions.methods, 'set')

    const new_token = 'new.access.token'
    signer.sign.mockReturnValueOnce(new_token)

    const result: any = await refreshSession({
      signature: stable_refresh,
      user_agent,
    })({ signer, accounts, sessions, config })

    expect(setSpy).not.toHaveBeenCalled()

    expect(querySpy).toHaveBeenCalledWith(
      QueryBuilder().filterBy('refresh_token', '==', stable_refresh).build(),
    )

    expect(isRight(result)).toBeTruthy()

    expect(result.value).toEqual(
      expect.objectContaining({
        account,
        token: expect.objectContaining({ value: new_token }),
        refresh_token: expect.objectContaining({ value: stable_refresh }),
      }),
    )

    expect(result.value.refresh_token.expiresIn).toBe(
      session.props.expiresIn.getTime(),
    )

    expect(signer.sign).toHaveBeenCalledTimes(1)
    expect(signer.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: session.meta!.id,
        expiresIn: 60 * 60 * 1000,
      }),
    )
  })

  it('should renew the refresh token when less than 24h remains (and update the session)', async () => {
    const expSoon = new Date(Date.now() + dayTime / 2)
    let session = createSession({
      account_id,
      user_agent: 'Old-UA',
      refresh_token: 'old.refresh',
      expiresIn: expSoon,
    })

    session = await sessions.methods.set(session)

    const account = await accounts.methods.set(
      createAccount(
        {
          name: 'john',
          external_ref: 'external_ref',
          roles: [],
        },
        {
          id: account_id,
          _r: 'entity',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ),
    )

    const setSpy = jest.spyOn(sessions.methods, 'set')

    const new_refresh = 'new.refresh.token'
    const new_token = 'new.access.token'

    signer.sign.mockReturnValueOnce(new_refresh).mockReturnValueOnce(new_token)

    const result: any = await refreshSession({
      signature: 'old.refresh',
      user_agent,
    })({ signer, accounts, sessions, config })

    expect(setSpy).toHaveBeenCalled()

    expect(isRight(result)).toBeTruthy()
    expect(result.value).toEqual(
      expect.objectContaining({
        account,
        token: expect.objectContaining({ value: new_token }),
        refresh_token: expect.objectContaining({ value: new_refresh }),
      }),
    )

    expect(signer.sign).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        subject: account_id,
        expiresIn: 5 * dayTime,
      }),
    )
    expect(signer.sign).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        subject: session.meta!.id,
        expiresIn: 60 * 60 * 1000,
      }),
    )
  })

  it('should return Left when repository query throws an exception', async () => {
    const spy = jest
      .spyOn(sessions.methods, 'query')
      .mockImplementationOnce(() => {
        throw new Error('repo failure')
      })

    const result = await refreshSession({
      signature: refresh_signature,
      user_agent,
    })({ signer, accounts, sessions, config })

    expect(spy).toHaveBeenCalled()
    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Invalid Signature')
  })
})
