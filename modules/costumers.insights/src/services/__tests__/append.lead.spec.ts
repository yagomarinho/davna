import { isRight } from '@davna/core'
import { InMemoryRepository } from '@davna/repositories'

import { Lead } from '../../entities/lead'
import { appendLead } from '../append.lead'

describe('appendLead Service', () => {
  it('should persist it', async () => {
    const leads = InMemoryRepository<Lead>()
    const setSpy = jest.spyOn(leads, 'set')

    const result = await appendLead({ lead: '21999998888' })({ leads })

    expect(isRight(result)).toBeTruthy()

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: '21999998888' }),
    )

    expect(result.value).toEqual(expect.objectContaining({ id: '21999998888' }))
  })
})
