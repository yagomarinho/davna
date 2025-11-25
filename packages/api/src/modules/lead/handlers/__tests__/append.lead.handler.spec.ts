import { Left, Right } from '../../../../shared/core/either'
import { Repository } from '../../../../shared/core/repository'
import { Request } from '../../../../shared/core/request'
import { InMemoryRepository } from '../../../../shared/repositories/in.memory.repository'
import { Lead } from '../../entities/lead'
import { appendLead as service } from '../../services/append.lead'
import { appendLeadHandler } from '../append.lead.handler'

jest.mock('../../services/append.lead', () => ({
  appendLead: jest.fn(),
}))

const appendLead = service as any as jest.Mock

describe('appendLeadHandler', () => {
  let leads: Repository<Lead>

  beforeEach(() => {
    leads = InMemoryRepository<Lead>()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 when service returns Left', async () => {
    const req = Request.data({ lead: '(21)999998888' })

    appendLead.mockImplementationOnce(
      () => async () => Left({ message: 'invalid' }),
    )

    const result = await appendLeadHandler(req)({ leads })

    expect(result).toBeDefined()

    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: 'Invalid Lead Contact' }),
        metadata: expect.objectContaining({
          status: 400,
        }),
      }),
    )

    expect(appendLead).toHaveBeenCalledTimes(1)

    const calledWith = appendLead.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({
        lead: '(21)999998888',
      }),
    )
  })

  it('should return data when service returns Right', async () => {
    const req = Request({
      data: { lead: '21999998888' },
      metadata: {},
    })

    const payload = { id: '21999998888' }

    appendLead.mockImplementationOnce(() => async () => Right(payload))

    const result = await appendLeadHandler(req)({ leads })

    expect(result).toBeDefined()

    expect(result).toEqual(
      expect.objectContaining({
        data: payload,
      }),
    )

    expect(appendLead).toHaveBeenCalledTimes(1)

    const calledWith = appendLead.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({
        lead: '21999998888',
      }),
    )
  })
})
