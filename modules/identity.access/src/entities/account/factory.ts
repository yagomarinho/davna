/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Account } from './account'

import { Account_v1, type CreateAccount_v1Props } from './v1'
import { Account_v2, type CreateAccount_v2Props } from './v2'

export function createAccount(v2: CreateAccount_v2Props): Account
export function createAccount(v1: CreateAccount_v1Props): Account
export function createAccount(data: any): Account {
  if (Account_v1.is_v1(data)) return Account_v1(data)
  return Account_v2(data)
}
