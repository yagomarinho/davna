/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
