/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EntityMeta } from '@davna/core'

export interface EntityDTO extends Omit<
  EntityMeta,
  '_idempotency_key' | '_r'
> {}
