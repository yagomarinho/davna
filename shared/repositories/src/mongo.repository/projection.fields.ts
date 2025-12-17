/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '@davna/core'

export type ProjectionFields<E extends Entity> = {
  [x in keyof E['props']]?: 0 | 1
} & { [x: string]: 0 | 1 }
