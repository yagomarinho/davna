/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'
import { AudioURI, TextURI } from '../vertices'

export const SourceURI = 'source'
export type SourceURI = typeof SourceURI

export const SourceVersion = 'v1'
export type SourceVersion = typeof SourceVersion

export interface SourceProps {
  message_id: string
  source_id: string
  source_type: AudioURI | TextURI
}

export interface Source extends Entity<SourceProps, SourceURI, SourceVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [SourceURI]: Source
  }
}

export function createSource(props: SourceProps): DraftEntity<Source>
export function createSource(
  props: SourceProps,
  meta: undefined,
  _version: SourceVersion,
): DraftEntity<Source>
export function createSource(
  props: SourceProps,
  meta: EntityMeta,
  _version?: SourceVersion,
): Source
export function createSource(
  { message_id, source_id, source_type }: SourceProps,
  meta?: EntityMeta,
  _version: SourceVersion = SourceVersion,
): DraftEntity<Source> | Source {
  return createEntity(
    SourceURI,
    _version,
    createSource,
    { message_id, source_id, source_type },
    meta as any,
  )
}
