import { Repository, Right, Service, Writable } from '@davna/core'

import { Suggestion } from '../entities/suggestion'

interface Request {
  suggestion: string
}

interface Env {
  suggestions: Writable<Repository<Suggestion>>
}

export const appendSuggestion = Service<Request, Env, Suggestion>(
  ({ suggestion }) =>
    async ({ suggestions }) => {
      const s = await suggestions.set(Suggestion.create({ suggestion }))
      return Right(s)
    },
)
