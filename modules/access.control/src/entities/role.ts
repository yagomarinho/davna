/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

export const RoleURI = 'role'
export type RoleURI = typeof RoleURI

const RoleVersion = 'v1'
type RoleVersion = typeof RoleVersion

export interface RoleProps {
  name: string
  description: string
}

declare module '@davna/core' {
  interface EntityURItoKind {
    readonly [RoleURI]: Role
  }
}

export interface Role extends Entity<RoleProps, RoleURI, RoleVersion> {}

export interface CreateRoleProps extends RoleProps, Partial<Entity> {}

export function createRole(props: RoleProps): DraftEntity<Role>
export function createRole(
  props: RoleProps,
  meta: undefined,
  _version: RoleVersion,
): DraftEntity<Role>
export function createRole(
  props: RoleProps,
  meta: EntityMeta,
  _version?: RoleVersion,
): Role
export function createRole(
  props: RoleProps,
  meta?: EntityMeta,
  _version: RoleVersion = RoleVersion,
): any {
  return createEntity(
    RoleURI,
    _version,
    createRole,
    { name: props.name, description: props.description },
    meta as any,
  )
}
