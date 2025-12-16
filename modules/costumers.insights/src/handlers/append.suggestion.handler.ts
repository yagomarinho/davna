/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
