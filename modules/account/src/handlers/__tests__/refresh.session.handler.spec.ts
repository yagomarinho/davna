import { Left, Right } from '../../../../shared/core/either'
import { Repository } from '../../../../shared/core/repository'
import { Request } from '../../../../shared/core/request'
import { InMemoryRepository } from '../../../../shared/repositories/in.memory.repository'
import { Session } from '../../entities/session'
import { Signer } from '../../helpers/signer'
import { refreshSessionHandler } from '../refresh.session.handler'
import { refreshSession as service } from '../../services/refresh.session'
import { tokenFromBearer as tokenFromBearerModule } from '../../../../shared/utils/token.from.bearer'

jest.mock('../../services/refresh.session', () => ({
  refreshSession: jest.fn(),
}))

jest.mock('../../../../shared/utils/token.from.bearer', () => ({
  tokenFromBearer: jest.fn(),
}))

const refreshSession = service as any as jest.Mock
const tokenFromBearer = tokenFromBearerModule as any as jest.Mock

describe('refreshSessionHandler', () => {
  const user_agent = 'Mozilla/5.0 (test)'

  let sessions: Repository<Session>
  let signer: jest.Mocked<Signer>

  beforeEach(() => {
    sessions = InMemoryRepository<Session>()

    signer = {
      sign: jest.fn(),
      decode: jest.fn(),
    } as unknown as jest.Mocked<Signer>

    jest.clearAllMocks()
  })

  it('should throw when refresh bearer header is missing', async () => {
    const req = Request({
      data: {},
      metadata: { headers: {} },
    })

    await expect(
      refreshSessionHandler(req)({
        sessions,
        signer,
      }),
    ).rejects.toThrow('Invalid Session')
  })

  it('should return 401 Response when tokenFromBearer throws (invalid bearer)', async () => {
    const bearer = 'invalid-bearer'
    const req = Request({
      data: {},
      metadata: {
        headers: {
          'user-agent': user_agent,
          'x-refresh-authorization': bearer,
        },
      },
    })

    tokenFromBearer.mockImplementationOnce(() => {
      throw new Error('bad token')
    })

    const result = await refreshSessionHandler(req)({
      sessions,
      signer,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: 'Invalid Session' }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 401 }),
        }),
      }),
    )

    expect(tokenFromBearer).toHaveBeenCalledTimes(1)
    expect(tokenFromBearer).toHaveBeenCalledWith(bearer)
  })

  it('should return 401 Response when refreshSession service returns Left', async () => {
    const bearer = 'Bearer sig-123'
    const signature = 'sig-123'
    const req = Request({
      data: {},
      metadata: {
        headers: {
          'user-agent': user_agent,
          'x-refresh-authorization': bearer,
        },
      },
    })

    tokenFromBearer.mockImplementationOnce((b: string) => {
      if (!b.startsWith('Bearer ')) throw new Error('bad')
      return b.split(' ')[1]
    })

    refreshSession.mockImplementationOnce(
      () => async () => Left({ status: 'error', message: 'Invalid' }),
    )

    const result = await refreshSessionHandler(req)({
      sessions,
      signer,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: 'Invalid Session' }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 401 }),
        }),
      }),
    )

    expect(tokenFromBearer).toHaveBeenCalledTimes(1)
    expect(tokenFromBearer).toHaveBeenCalledWith(bearer)

    const calledWith = refreshSession.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({ signature, user_agent }),
    )
  })

  it('should return Response.data with payload when refreshSession service returns Right', async () => {
    const bearer = 'Bearer sig-456'
    const signature = 'sig-456'
    const req = Request({
      data: {},
      metadata: {
        headers: {
          'user-agent': user_agent,
          'x-refresh-authorization': bearer,
        },
      },
    })

    tokenFromBearer.mockImplementationOnce((b: string) => {
      if (!b.startsWith('Bearer ')) throw new Error('bad')
      return b.split(' ')[1]
    })

    const servicePayload = {
      token: { value: 'new-access' },
      refresh_token: { value: 'new-refresh' },
    }

    refreshSession.mockImplementationOnce(
      () => async () => Right(servicePayload),
    )

    const result = await refreshSessionHandler(req)({
      sessions,
      signer,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: servicePayload,
      }),
    )

    expect(tokenFromBearer).toHaveBeenCalledTimes(1)
    expect(tokenFromBearer).toHaveBeenCalledWith(bearer)

    const calledWith = refreshSession.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({ signature, user_agent }),
    )
  })
})
