/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'
import { AudioURI, ClassroomURI, MessageURI, TextURI } from '../vertices'

export const OwnershipURI = 'ownership'
export type OwnershipURI = typeof OwnershipURI

export const OwnershipVersion = 'v1'
export type OwnershipVersion = typeof OwnershipVersion

export interface OwnershipProps {
  participant_id: string
  resource_id: string
  resource_type: ClassroomURI | MessageURI | AudioURI | TextURI
}

export interface Ownership extends Entity<
  OwnershipProps,
  OwnershipURI,
  OwnershipVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [OwnershipURI]: Ownership
  }
}
export function createOwnership(props: OwnershipProps): DraftEntity<Ownership>
export function createOwnership(
  props: OwnershipProps,
  meta: undefined,
  _version: OwnershipVersion,
): DraftEntity<Ownership>
export function createOwnership(
  props: OwnershipProps,
  meta: EntityMeta,
  _version?: OwnershipVersion,
): Ownership
export function createOwnership(
  { participant_id, resource_id, resource_type }: OwnershipProps,
  meta?: EntityMeta,
  _version: OwnershipVersion = OwnershipVersion,
): DraftEntity<Ownership> | Ownership {
  return createEntity(
    OwnershipURI,
    _version,
    createOwnership,
    { participant_id, resource_id, resource_type },
    meta as any,
  )
}
