import type { Signer } from '@davna/providers'
import { isLeft, isRight, Repository } from '@davna/core'
import { InMemoryRepository } from '@davna/repositories'

import { Session } from '../../entities/session'
import { REFRESH_STRATEGY, verifySession } from '../verify.session'

import { makeConfig } from '../../fakes/make.config'

const dayTime = 24 * 60 * 60 * 1000

describe('verify session service', () => {
  const account_id = 'account.id'
  const signature = 'signed.jwt'
  const user_agent = 'Mozilla/5.0'

  let signer: jest.Mocked<Signer>
  let sessions: Repository<Session>
  const config = makeConfig()

  beforeEach(() => {
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
    })({ signer, sessions, config })

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
    })({ signer, sessions, config })

    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Invalid Signature')
  })

  it('should return Left and remove expired session', async () => {
    let expired = Session.create({
      account_id,
      refresh_token: signature,
      user_agent,
      expiresIn: new Date(Date.now() - dayTime),
    })

    expired = await sessions.set(expired)

    const removeSpy = jest.spyOn(sessions, 'remove')

    signer.decode.mockReturnValue({
      subject: expired.id,
      expiresIn: expired.expiresIn.getTime(),
    })

    const result = await verifySession({
      signature: 'any-session-signature',
      user_agent,
    })({ signer, sessions, config })

    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: expired.id }),
    )
    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Invalid Signature')
  })

  it('should reuse refresh token under LAX strategy when more than 24h remains', async () => {
    const new_token = 'new_token'
    const refresh_stable = 'refresh-stable'

    let session = Session.create({
      account_id,
      user_agent,
      expiresIn: new Date(Date.now() + 3 * dayTime),
      refresh_token: refresh_stable,
    })

    session = await sessions.set(session)

    const setSpy = jest.spyOn(sessions, 'set')

    signer.decode.mockReturnValue({
      subject: session.id,
      expiresIn: session.expiresIn.getTime(),
    })

    signer.sign.mockReturnValue(new_token)

    const result: any = await verifySession({
      signature,
      user_agent,
      refresh_strategy: REFRESH_STRATEGY.LAX,
    })({ signer, sessions, config })

    expect(setSpy).not.toHaveBeenCalled()

    expect(isRight(result)).toBeTruthy()
    // Deve emitir Right com novo token de acesso e refresh original
    expect(result.value).toEqual(
      expect.objectContaining({
        token: expect.objectContaining({ value: new_token }),
        refresh_token: expect.objectContaining({ value: refresh_stable }),
      }),
    )
  })

  it('should renew refresh token under LAX strategy when less than 24h remains', async () => {
    const new_token = 'new_token'
    const new_refresh = 'new_refresh'
    const lessThan24h = new Date(Date.now() + dayTime / 2) // +12h

    let session = Session.create({
      account_id,
      user_agent,
      expiresIn: lessThan24h,
      refresh_token: 'refresh-old',
    })

    session = await sessions.set(session)

    const setSpy = jest.spyOn(sessions, 'set')

    signer.decode.mockReturnValue({
      subject: session.id,
      expiresIn: session.expiresIn.getTime(),
    })

    signer.sign.mockReturnValueOnce(new_refresh)
    signer.sign.mockReturnValueOnce(new_token)

    const result: any = await verifySession({
      signature,
      user_agent,
      refresh_strategy: REFRESH_STRATEGY.LAX,
    })({ signer, sessions, config })

    expect(setSpy).toHaveBeenCalled()

    expect(isRight(result)).toBeTruthy()
    expect(result.value).toEqual(
      expect.objectContaining({
        token: expect.objectContaining({ value: new_token }),
        refresh_token: expect.objectContaining({ value: new_refresh }),
      }),
    )
  })

  it('should always renew tokens under FORCE strategy', async () => {
    const new_token = 'new_token'
    const new_refresh = 'new_refresh'

    let session = Session.create({
      account_id,
      user_agent,
      refresh_token: 'refresh-old',
      expiresIn: new Date(Date.now() + 5 * dayTime),
    })

    session = await sessions.set(session)

    const setSpy = jest.spyOn(sessions, 'set')

    signer.decode.mockReturnValue({
      subject: session.id,
      expiresIn: session.expiresIn.getTime(),
    })

    signer.sign.mockReturnValueOnce(new_refresh)
    signer.sign.mockReturnValueOnce(new_token)

    const result: any = await verifySession({
      signature,
      user_agent,
      refresh_strategy: REFRESH_STRATEGY.FORCE,
    })({ signer, sessions, config })

    expect(setSpy).toHaveBeenCalled()

    expect(isRight(result)).toBeTruthy()
    expect(result.value).toEqual(
      expect.objectContaining({
        token: expect.objectContaining({ value: new_token }),
        refresh_token: expect.objectContaining({ value: new_refresh }),
      }),
    )
  })
})
