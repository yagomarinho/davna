/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Account_v2 } from './v2'

import { applyTag, applyVersioning } from '@davna/core'

import { Account_URI } from './uri'
import { createAccount } from './factory'

export interface Account extends Account_v2 {}

export function Account(
  id: string,
  name: string,
  external_ref: string,
  roles: string[],
  created_at: Date,
  updated_at: Date,
): Account {
  return applyVersioning('v2')(
    applyTag(Account_URI)({
      id,
      name,
      external_ref,
      roles,
      created_at,
      updated_at,
    }),
  )
}

Account.create = createAccount
