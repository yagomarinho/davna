/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'
import {
  AudioURI,
  ClassroomURI,
  MessageURI,
  ParticipantURI,
  TextURI,
} from '../vertices'

export const RepresentationURI = 'representation'
export type RepresentationURI = typeof RepresentationURI

export const RepresentationVersion = 'v1'
export type RepresentationVersion = typeof RepresentationVersion

export interface RepresentationProps {
  text_id: string
  resource_id: string
  resource_type: ClassroomURI | MessageURI | AudioURI | TextURI | ParticipantURI
}

export interface Representation extends Entity<
  RepresentationProps,
  RepresentationURI,
  RepresentationVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [RepresentationURI]: Representation
  }
}

export function createRepresentation(
  props: RepresentationProps,
): DraftEntity<Representation>
export function createRepresentation(
  props: RepresentationProps,
  meta: undefined,
  _version: RepresentationVersion,
): DraftEntity<Representation>
export function createRepresentation(
  props: RepresentationProps,
  meta: EntityMeta,
  _version?: RepresentationVersion,
): Representation
export function createRepresentation(
  { resource_id, resource_type, text_id }: RepresentationProps,
  meta?: EntityMeta,
  _version: RepresentationVersion = RepresentationVersion,
): DraftEntity<Representation> | Representation {
  return createEntity(
    RepresentationURI,
    _version,
    createRepresentation,
    { resource_id, resource_type, text_id },
    meta as any,
  )
}
