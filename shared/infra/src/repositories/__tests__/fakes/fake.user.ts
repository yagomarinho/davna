/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'
import { concatenate } from '@davna/kernel'

export interface UserProps {
  name: string
}

export const UserURI = 'user'
export type UserURI = typeof UserURI

export const UserVersion = 'v1'
export type UserVersion = typeof UserVersion

export interface User extends Entity<UserProps, UserURI, UserVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [UserURI]: User
  }
}

export function createUser(props: UserProps): DraftEntity<User>
export function createUser(props: UserProps, meta: EntityMeta): User
export function createUser({ name }: UserProps, meta?: EntityMeta): any {
  return createEntity(UserURI, UserVersion, createUser, { name }, meta as any)
}

export function setName(
  name: string,
  user: DraftEntity<User>,
): DraftEntity<User>
export function setName(name: string, user: User): User
export function setName(
  name: string,
  user: DraftEntity<User> | User,
): DraftEntity<User> | User {
  return createUser(concatenate(user.props, { name }), user.meta as any)
}
