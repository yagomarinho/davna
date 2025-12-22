import { isLeft, isRight, Repository } from '@davna/core'
import { InMemoryRepository, type Signer } from '@davna/infra'

import { createSession, Session } from '../../entities/session'
import { REFRESH_STRATEGY, verifySession } from '../verify.session'

import { makeConfig } from '../../fakes/make.config'
import { Account, createAccount } from '../../entities'

const dayTime = 24 * 60 * 60 * 1000

describe('verify session service', () => {
  const account_id = 'account.id'
  const signature = 'signed.jwt'
  const user_agent = 'Mozilla/5.0'

  let signer: jest.Mocked<Signer>
  let accounts: Repository<Account>
  let sessions: Repository<Session>
  const config = makeConfig()

  beforeEach(() => {
    accounts = InMemoryRepository<Account>()
    sessions = InMemoryRepository<Session>()

    signer = {
      sign: jest.fn(),
      decode: jest.fn(),
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return Left when decode throws an error (invalid signature)', async () => {
    signer.decode.mockImplementationOnce(() => {
      throw new Error('bad token')
    })

    const result = await verifySession({
      signature,
      user_agent,
    })({ signer, sessions, accounts, config })

    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Invalid Signature')
  })

  it('should return Left when session does not exist', async () => {
    signer.decode.mockReturnValue({
      subject: 'non-existant-session',
      expiresIn: Date.now() + dayTime,
    })

    const result = await verifySession({
      signature,
      user_agent,
    })({ signer, sessions, accounts, config })

    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Invalid Signature')
  })

  it('should return Left and remove expired session', async () => {
    let expired = createSession({
      account_id,
      refresh_token: signature,
      user_agent,
      expiresIn: new Date(Date.now() - dayTime),
    })

    expired = await sessions.methods.set(expired)

    const removeSpy = jest.spyOn(sessions.methods, 'remove')

    signer.decode.mockReturnValue({
      subject: expired.meta!.id,
      expiresIn: expired.props.expiresIn.getTime(),
    })

    const result = await verifySession({
      signature: 'any-session-signature',
      user_agent,
    })({ signer, sessions, accounts, config })

    expect(removeSpy).toHaveBeenCalledWith(expired.meta!.id)
    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Invalid Signature')
  })

  it('should return Left and remove session with no related account', async () => {
    let expired = createSession({
      account_id,
      refresh_token: signature,
      user_agent,
      expiresIn: new Date(Date.now() + dayTime),
    })

    expired = await sessions.methods.set(expired)

    const removeSpy = jest.spyOn(sessions.methods, 'remove')

    signer.decode.mockReturnValue({
      subject: expired.meta!.id,
      expiresIn: expired.props.expiresIn.getTime(),
    })

    const result = await verifySession({
      signature: 'any-session-signature',
      user_agent,
    })({ signer, sessions, accounts, config })

    expect(removeSpy).toHaveBeenCalledWith(expired.meta!.id)
    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Invalid Account Session')
  })

  it('should reuse refresh token under LAX strategy when more than 24h remains', async () => {
    const new_token = 'new_token'
    const refresh_stable = 'refresh-stable'

    let session = createSession({
      account_id,
      user_agent,
      expiresIn: new Date(Date.now() + 3 * dayTime),
      refresh_token: refresh_stable,
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
          _idempotency_key: '',
        },
      ),
    )

    const setSpy = jest.spyOn(sessions.methods, 'set')

    signer.decode.mockReturnValue({
      subject: session.meta!.id,
      expiresIn: session.props.expiresIn.getTime(),
    })

    signer.sign.mockReturnValue(new_token)

    const result: any = await verifySession({
      signature,
      user_agent,
      refresh_strategy: REFRESH_STRATEGY.LAX,
    })({ signer, sessions, accounts, config })

    expect(setSpy).not.toHaveBeenCalled()

    expect(isRight(result)).toBeTruthy()
    // Deve emitir Right com novo token de acesso e refresh original
    expect(result.value).toEqual(
      expect.objectContaining({
        account,
        token: expect.objectContaining({ value: new_token }),
        refresh_token: expect.objectContaining({ value: refresh_stable }),
      }),
    )
  })

  it('should renew refresh token under LAX strategy when less than 24h remains', async () => {
    const new_token = 'new_token'
    const new_refresh = 'new_refresh'
    const lessThan24h = new Date(Date.now() + dayTime / 2) // +12h

    let session = createSession({
      account_id,
      user_agent,
      expiresIn: lessThan24h,
      refresh_token: 'refresh-old',
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
          _idempotency_key: '',
        },
      ),
    )

    const setSpy = jest.spyOn(sessions.methods, 'set')

    signer.decode.mockReturnValue({
      subject: session.meta!.id,
      expiresIn: session.props.expiresIn.getTime(),
    })

    signer.sign.mockReturnValueOnce(new_refresh)
    signer.sign.mockReturnValueOnce(new_token)

    const result: any = await verifySession({
      signature,
      user_agent,
      refresh_strategy: REFRESH_STRATEGY.LAX,
    })({ signer, sessions, accounts, config })

    expect(setSpy).toHaveBeenCalled()

    expect(isRight(result)).toBeTruthy()
    expect(result.value).toEqual(
      expect.objectContaining({
        account,
        token: expect.objectContaining({ value: new_token }),
        refresh_token: expect.objectContaining({ value: new_refresh }),
      }),
    )
  })

  it('should always renew tokens under FORCE strategy', async () => {
    const new_token = 'new_token'
    const new_refresh = 'new_refresh'

    let session = createSession({
      account_id,
      user_agent,
      refresh_token: 'refresh-old',
      expiresIn: new Date(Date.now() + 5 * dayTime),
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
          _idempotency_key: '',
        },
      ),
    )

    const setSpy = jest.spyOn(sessions.methods, 'set')

    signer.decode.mockReturnValue({
      subject: session.meta!.id,
      expiresIn: session.props.expiresIn.getTime(),
    })

    signer.sign.mockReturnValueOnce(new_refresh)
    signer.sign.mockReturnValueOnce(new_token)

    const result: any = await verifySession({
      signature,
      user_agent,
      refresh_strategy: REFRESH_STRATEGY.FORCE,
    })({ signer, sessions, accounts, config })

    expect(setSpy).toHaveBeenCalled()

    expect(isRight(result)).toBeTruthy()
    expect(result.value).toEqual(
      expect.objectContaining({
        account,
        token: expect.objectContaining({ value: new_token }),
        refresh_token: expect.objectContaining({ value: new_refresh }),
      }),
    )
  })
})
