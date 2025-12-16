/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '@davna/core'

export type OmitEntityProps<E extends Entity> = Omit<
  E,
  'id' | 'created_at' | 'updated_at' | '__tag' | '__version'
>
