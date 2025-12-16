/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { applyTag, applyVersioning, Entity } from '@davna/core'

const URI = 'suggestion'
type URI = typeof URI

export interface SuggestionProps {
  suggestion: string
}

export interface Suggestion extends SuggestionProps, Entity<URI, 'v1'> {}

export interface CreateSuggestion extends SuggestionProps, Partial<Entity> {}

export function Suggestion(
  id: string,
  suggestion: string,
  created_at: Date,
  updated_at: Date,
): Suggestion {
  return applyVersioning('v1')(
    applyTag(URI)({
      id,
      suggestion,
      created_at,
      updated_at,
    }),
  )
}

Suggestion.create = ({
  id = '',
  suggestion,
  created_at,
  updated_at,
}: CreateSuggestion) => {
  const now = new Date()
  return Suggestion(id, suggestion, created_at ?? now, updated_at ?? now)
}
