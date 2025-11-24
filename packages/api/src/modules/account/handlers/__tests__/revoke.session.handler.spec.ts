import { Left, Right } from '../../../../shared/core/either'
import { Repository } from '../../../../shared/core/repository'
import { Request } from '../../../../shared/core/request'
import { InMemoryRepository } from '../../../../shared/repositories/in.memory.repository'
import { Session } from '../../entities/session'
import { revokeSession as service } from '../../services/revoke.session'
import { revokeSessionHandler } from '../revoke.session.handler'

jest.mock('../../services/revoke.session', () => ({
  revokeSession: jest.fn(),
}))

const revokeSession = service as any as jest.Mock

describe('revokeSessionHandler', () => {
  const sessionId = 'session-123'
  let sessions: Repository<Session>

  beforeEach(() => {
    sessions = InMemoryRepository<Session>()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 Response with message when revokeSession service returns Left', async () => {
    const req = Request({
      data: {},
      metadata: { session: { id: sessionId } },
    })

    const errorPayload = { message: 'cannot revoke' }
    revokeSession.mockImplementationOnce(() => async () => Left(errorPayload))

    const result = await revokeSessionHandler(req)({ sessions })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: errorPayload.message }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 400 }),
        }),
      }),
    )

    expect(revokeSession).toHaveBeenCalledTimes(1)
    const calledWith = revokeSession.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({ session_id: sessionId }),
    )
  })

  it('should return 204 Response.metadata when revokeSession service returns Right', async () => {
    const req = Request({
      data: {},
      metadata: { session: { id: sessionId } },
    })

    // success: Right-like shape (adjust to Right(...) if you have that helper)
    revokeSession.mockImplementationOnce(() => async () => Right())

    const result = await revokeSessionHandler(req)({ sessions })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 204 }),
        }),
      }),
    )

    expect(revokeSession).toHaveBeenCalledTimes(1)
    const calledWith = revokeSession.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({ session_id: sessionId }),
    )
  })
})
