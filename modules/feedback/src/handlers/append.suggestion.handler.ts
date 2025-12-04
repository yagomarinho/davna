import { Handler, Repository, Response, Writable } from '@davna/core'

import { Suggestion } from '../entities/suggestion'
import { appendSuggestion } from '../services/append.suggestion'

interface Env {
  suggestions: Writable<Repository<Suggestion>>
}

export const appendSuggestionHandler = Handler(
  request =>
    async ({ suggestions }: Env) => {
      const { suggestion } = request.data

      const result = await appendSuggestion({ suggestion })({ suggestions })

      return Response.data(result.value)
    },
)
