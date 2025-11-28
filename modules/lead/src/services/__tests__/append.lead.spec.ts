import { isLeft, isRight } from '@davna/core'
import { InMemoryRepository } from '@davna/repositories'

import { Lead } from '../../entities/lead'
import { appendLead } from '../append.lead'

describe('appendLead Service', () => {
  it('should return Left when lead is an invalid phone (too short)', async () => {
    const leads = InMemoryRepository<Lead>()
    const setSpy = jest.spyOn(leads, 'set')

    const result = await appendLead({ lead: '123' })({ leads })

    expect(isLeft(result)).toBeTruthy()

    expect(JSON.stringify(result)).toContain('Phone number is not valid')
    expect(setSpy).not.toHaveBeenCalled()
  })

  it('should normalize (21)999998888 to 21999998888 and persist it', async () => {
    const leads = InMemoryRepository<Lead>()
    const setSpy = jest.spyOn(leads, 'set')

    const result = await appendLead({ lead: '(21)999998888' })({ leads })

    expect(isRight(result)).toBeTruthy()

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: '21999998888' }),
    )

    expect(result.value).toEqual(expect.objectContaining({ id: '21999998888' }))
  })

  it('should normalize "21 99999-8888" to 21999998888 and persist it', async () => {
    const leads = InMemoryRepository<Lead>()
    const setSpy = jest.spyOn(leads, 'set')

    const result = await appendLead({ lead: '21 99999-8888' })({ leads })

    expect(isRight(result)).toBeTruthy()
    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: '21999998888' }),
    )
    expect(result.value).toEqual(expect.objectContaining({ id: '21999998888' }))
  })

  it('should return Left and not persist when lead is clearly invalid (letters)', async () => {
    const leads = InMemoryRepository<Lead>()
    const setSpy = jest.spyOn(leads, 'set')

    const result = await appendLead({ lead: 'invalid-phone' })({ leads })

    expect(isLeft(result)).toBeTruthy()
    expect(JSON.stringify(result)).toContain('Phone number is not valid')
    expect(setSpy).not.toHaveBeenCalled()
  })
})
