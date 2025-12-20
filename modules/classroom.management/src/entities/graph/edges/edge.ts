/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, EntityURIS, Version } from '@davna/core'

export interface EdgeProps {
  source_id: string
  target_id: string
}

export interface Edge<
  P extends EdgeProps,
  U extends EntityURIS,
  V extends Version,
> extends Entity<P, U, V> {}
