/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Identifier } from '@davna/core'

export interface User extends Identifier {
  name: string
}

export interface Auth {
  authenticate: (email: string, password: string) => Promise<User>
  getUser: (id: string) => Promise<User>
}
