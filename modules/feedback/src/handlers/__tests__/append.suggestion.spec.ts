import { Repository, Request, Right } from '@davna/core'
import { InMemoryRepository } from '@davna/repositories'

import { appendSuggestionHandler } from '../append.suggestion.handler'
import { appendSuggestion as service } from '../../services/append.suggestion'
import { Suggestion } from '../../entities/suggestion'

jest.mock('../../services/append.suggestion', () => ({
  appendSuggestion: jest.fn(),
}))

const appendSuggestion = service as any as jest.Mock

describe('appendSuggestionHandler', () => {
  let suggestions: Repository<Suggestion>

  beforeEach(() => {
    suggestions = InMemoryRepository<Suggestion>()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return data when service returns Right', async () => {
    const req = Request({
      data: { suggestion: 'This is a suggestion' },
      metadata: {},
    })

    const payload = { id: 'This is a suggestion' }

    appendSuggestion.mockImplementationOnce(() => async () => Right(payload))

    const result = await appendSuggestionHandler(req)({ suggestions })

    expect(result).toBeDefined()

    expect(result).toEqual(
      expect.objectContaining({
        data: payload,
      }),
    )

    expect(appendSuggestion).toHaveBeenCalledTimes(1)

    const calledWith = appendSuggestion.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({
        suggestion: 'This is a suggestion',
      }),
    )
  })
})
