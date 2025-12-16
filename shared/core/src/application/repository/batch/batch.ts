/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '../../../domain'
import { RemoveBatchItem, UpsertBatchItem } from './batch.item'

export type Batch<E extends Entity> = (UpsertBatchItem<E> | RemoveBatchItem)[]
