/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'
import { Metadata } from '@davna/kernel'

export const TextURI = 'text'
export type TextURI = typeof TextURI

export const TextVersion = 'v1'
export type TextVersion = typeof TextVersion

export interface TextProps {
  content: string
  metadata: Metadata
}

export interface Text extends Entity<TextProps, TextURI, TextVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [TextURI]: Text
  }
}

export function createText(props: TextProps): DraftEntity<Text>
export function createText(
  props: TextProps,
  meta: undefined,
  _version: TextVersion,
): DraftEntity<Text>
export function createText(
  props: TextProps,
  meta: EntityMeta,
  _version?: TextVersion,
): Text
export function createText(
  { content, metadata }: TextProps,
  meta?: EntityMeta,
  _version: TextVersion = TextVersion,
): DraftEntity<Text> | Text {
  return createEntity(
    TextURI,
    _version,
    createText,
    { content, metadata },
    meta as any,
  )
}
