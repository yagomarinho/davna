/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

export const IDURI = 'id'
export type IDURI = typeof IDURI

export const IDVersion = 'v1'
export type IDVersion = typeof IDVersion

export interface IdProps {
  entity_tag: string
}

export interface ID extends Entity<IdProps, IDURI, IDVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [IDURI]: ID
  }
}

export function createID(props: IdProps): DraftEntity<ID>
export function createID(
  props: IdProps,
  meta: undefined,
  _version: IDVersion,
): DraftEntity<ID>
export function createID(
  props: IdProps,
  meta: EntityMeta,
  _version?: IDVersion,
): ID
export function createID(
  { entity_tag }: IdProps,
  meta?: EntityMeta,
  _version: IDVersion = IDVersion,
): ID {
  return createEntity(IDURI, _version, createID, { entity_tag }, meta as any)
}
