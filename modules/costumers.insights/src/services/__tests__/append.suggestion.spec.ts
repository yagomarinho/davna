import { isRight } from '@davna/core'
import { InMemoryRepository } from '@davna/infra'

import { Suggestion } from '../../entities/suggestion'
import { appendSuggestion } from '../append.suggestion'

describe('appendLead Service', () => {
  it('should persist it', async () => {
    const suggestions = InMemoryRepository<Suggestion>()
    const setSpy = jest.spyOn(suggestions.methods, 'set')

    const data = {
      suggestion: 'This is a suggestion',
    }

    const result = await appendSuggestion(data)({ suggestions })

    expect(isRight(result)).toBeTruthy()

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({ props: { suggestion: data.suggestion } }),
      '',
    )

    expect(result.value).toEqual(
      expect.objectContaining({
        meta: expect.objectContaining({
          id: expect.any(String),
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
        }),
        props: {
          suggestion: data.suggestion,
        },
      }),
    )
  })
})
