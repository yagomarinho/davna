import { isRight } from '@davna/core'
import { InMemoryRepository } from '@davna/repositories'

import { Suggestion } from '../../entities/suggestion'
import { appendSuggestion } from '../append.suggestion'

describe('appendLead Service', () => {
  it('should persist it', async () => {
    const suggestions = InMemoryRepository<Suggestion>()
    const setSpy = jest.spyOn(suggestions, 'set')

    const data = {
      suggestion: 'This is a suggestion',
    }

    const result = await appendSuggestion(data)({ suggestions })

    expect(isRight(result)).toBeTruthy()

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({ suggestion: data.suggestion }),
    )

    expect(result.value).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        suggestion: data.suggestion,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      }),
    )
  })
})
