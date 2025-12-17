/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValidObject } from '@davna/kernel'

/**
 * Represents a sorting rule for query results.
 *
 * - A: the type of object being sorted
 *
 * Properties:
 * - property: the field of the object to sort by
 * - direction: the direction of sorting, either ascending ('asc') or descending ('desc')
 */

export interface Sort<A extends ValidObject> {
  /** The field of the object used for sorting */
  property: keyof A

  /** Sorting direction: 'asc' for ascending, 'desc' for descending */
  direction: 'asc' | 'desc'
}
