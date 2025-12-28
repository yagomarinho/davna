/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, EntityMeta } from '@davna/core'
import {
  Representation,
  RepresentationProps,
  RepresentationURI,
  RepresentationVersion,
} from './representation'

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
  { source_id, target_id, target_type, type, kind }: RepresentationProps,
  meta?: EntityMeta,
  _version: RepresentationVersion = RepresentationVersion,
): DraftEntity<Representation> | Representation {
  return createEntity(
    RepresentationURI,
    _version,
    createRepresentation,
    { source_id, target_id, target_type, type, kind } as any,
    meta as any,
  )
}
