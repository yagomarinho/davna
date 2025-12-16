/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '../../../../domain'
import { Batch, BatchResult } from '../../batch'
import { RepositoryResult } from '../types'

export interface RepositoryBatcher<E extends Entity> {
  (b: Batch<E>): RepositoryResult<BatchResult>
}
