/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValidObject } from '@davna/kernel'

import { Sort } from './sort'
import { Where } from './where'

/**
 * Represents a structured query for retrieving domain objects.
 *
 * - A: the type of objects being queried, constrained to ValidObject
 *
 * The query supports:
 * - filtering using conditions (filter_by)
 * - ordering (order_by)
 * - pagination via cursor references (cursor_ref)
 * - batch size control for result sets (batch_size)
 */

export interface Query<A extends ValidObject> {
  /** Conditions used to filter the objects returned by the query */
  filter_by: Where<A>

  /** Sorting rules applied to the results, can include multiple fields */
  order_by: Sort<A>[]

  /** Cursor reference used for pagination; marks the starting point */
  cursor_ref: string

  /** Maximum number of results to return in a single batch */
  batch_size: number
}
