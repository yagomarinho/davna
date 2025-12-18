/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

export const AccountURI = 'account'
export type AccountURI = typeof AccountURI

export const AccountVersion = 'v2'
export type AccountVersion = typeof AccountVersion

export interface AccountProps {
  name: string
  external_ref: string
  roles: string[]
}

export interface Account extends Entity<
  AccountProps,
  AccountURI,
  AccountVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [AccountURI]: Account
  }
}

export function createAccount(props: AccountProps): DraftEntity<Account>
export function createAccount(
  props: AccountProps,
  meta: undefined,
  _version: AccountVersion,
): DraftEntity<Account>
export function createAccount(
  props: AccountProps,
  meta: EntityMeta,
  _version?: AccountVersion,
): Account
export function createAccount(
  { name, external_ref, roles }: AccountProps,
  meta?: EntityMeta,
  _version: AccountVersion = AccountVersion,
): any {
  return createEntity(
    AccountURI,
    _version,
    createAccount,
    { name, external_ref, roles },
    meta as any,
  )
}
