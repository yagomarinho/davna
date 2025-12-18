/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

export const SuggestionURI = 'suggestion'
export type SuggestionURI = typeof SuggestionURI

export const SuggestionVersion = 'v1'
export type SuggestionVersion = typeof SuggestionVersion

export interface SuggestionProps {
  suggestion: string
}

export interface Suggestion
  extends
    SuggestionProps,
    Entity<SuggestionProps, SuggestionURI, SuggestionVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    readonly [SuggestionURI]: Suggestion
  }
}

export function createSuggestion(
  props: SuggestionProps,
): DraftEntity<Suggestion>
export function createSuggestion(
  props: SuggestionProps,
  meta: undefined,
  _version: SuggestionVersion,
): DraftEntity<Suggestion>
export function createSuggestion(
  props: SuggestionProps,
  meta: EntityMeta,
  _version?: SuggestionVersion,
): Suggestion
export function createSuggestion(
  { suggestion }: SuggestionProps,
  meta?: EntityMeta,
  _version: SuggestionVersion = SuggestionVersion,
): Suggestion {
  return createEntity(
    SuggestionURI,
    _version,
    createSuggestion,
    { suggestion },
    meta as any,
  )
}
