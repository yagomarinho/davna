/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValidObject } from './valid.object'

export type Merge<A extends ValidObject, B extends ValidObject> = {
  [Key in keyof A | keyof B]: Key extends keyof B
    ? B[Key]
    : Key extends keyof A
      ? A[Key]
      : never
}
