/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, Entity, EntityMeta, Tag } from '@davna/core'

export const OcursInURI = 'occurs-in'
export type OcursInURI = typeof OcursInURI

export const OcursInVersion = 'v1'
export type OcursInVersion = typeof OcursInVersion

export interface OccursInProps {
  classroom_id: string
  message_id: string
}

export interface OccursIn extends Entity<
  OccursInProps,
  OcursInURI,
  OcursInVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [OcursInURI]: OccursIn
  }
}

export function createOccursIn(props: OccursInProps): Tag<OcursInURI>
export function createOccursIn(
  props: OccursInProps,
  meta: undefined,
  _version: OcursInVersion,
): Tag<OcursInURI>
export function createOccursIn(
  props: OccursInProps,
  meta: EntityMeta,
  _version?: OcursInVersion,
): OccursIn
export function createOccursIn(
  { classroom_id, message_id }: OccursInProps,
  meta?: EntityMeta,
  _version: OcursInVersion = OcursInVersion,
): Tag<OcursInURI> | OccursIn {
  return createEntity(
    OcursInURI,
    _version,
    createOccursIn,
    { classroom_id, message_id },
    meta as any,
  )
}
