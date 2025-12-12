import { isLeft, isRight, Repository } from '@davna/core'
import { InMemoryRepository } from '@davna/repositories'

import { Session } from '../../entities/session'
import { revokeSession } from '../revoke.session'

const dayTime = 24 * 60 * 60 * 1000

describe('revoke session service', () => {
  let sessions: Repository<Session>

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-11-07T12:00:00Z'))
    sessions = InMemoryRepository<Session>()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('should return Left when session does not exist', async () => {
    const result = await revokeSession({ session_id: 'non-existent' })({
      sessions,
    })

    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Session already revoked')
  })

  it('should return Left and remove when the session is expired', async () => {
    let expired = Session.create({
      account_id: 'acc-1',
      user_agent: 'UA',
      refresh_token: 'refresh',
      expiresIn: new Date(Date.now() - dayTime),
    })

    expired = await sessions.set(expired)

    const removeSpy = jest.spyOn(sessions, 'remove')

    const result = await revokeSession({ session_id: expired.id })({ sessions })

    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: expired.id }),
    )

    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Session already revoked')
  })

  it('should remove an active session and return Right', async () => {
    let active = Session.create({
      account_id: 'acc-1',
      user_agent: 'UA',
      refresh_token: 'refresh',
      expiresIn: new Date(Date.now() + 3 * dayTime),
    })

    active = await sessions.set(active)

    const removeSpy = jest.spyOn(sessions, 'remove')

    const result: any = await revokeSession({ session_id: active.id })({
      sessions,
    })

    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: active.id }),
    )
    expect(isRight(result)).toBeTruthy()

    const fetched = await sessions.get(active.id)
    expect(fetched).toBeUndefined()
  })

  it('should be idempotent: subsequent calls on same session return Left', async () => {
    let session = Session.create({
      account_id: 'acc-1',
      user_agent: 'UA',
      refresh_token: 'refresh',
      expiresIn: new Date(Date.now() + dayTime),
    })
    session = await sessions.set(session)

    const first = await revokeSession({ session_id: session.id })({ sessions })
    expect(isRight(first)).toBeTruthy()

    const second = await revokeSession({ session_id: session.id })({ sessions })
    expect(isLeft(second)).toBeTruthy()
    expect(JSON.stringify(second)).toContain('Session already revoked')
  })
})
