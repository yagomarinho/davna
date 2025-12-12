import { Repository, Request, Right } from '@davna/core'
import { InMemoryRepository } from '@davna/repositories'

import { Lead } from '../../entities/lead'
import { appendLeadHandler } from '../append.lead.handler'
import { appendLead as service } from '../../services/append.lead'

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
