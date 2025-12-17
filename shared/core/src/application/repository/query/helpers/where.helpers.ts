/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isObject } from '@davna/kernel'
import { Where, WhereComposite, WhereLeaf } from '../models'

/**
 * Type guard factory for Where nodes.
 *
 * Returns a function that checks if a given Where node
 * is either a composite or a leaf.
 *
 * Overloads:
 * - 'composite': returns a type guard for WhereComposite
 * - 'leaf': returns a type guard for WhereLeaf
 */
function is(
  type: 'composite',
): (where: Where<any>) => where is WhereComposite<any>
function is(type: 'leaf'): (where: Where<any>) => where is WhereLeaf<any>
function is(type: string) {
  return (where: Where<any>): boolean =>
    typeof where.value === 'string' ? type === 'composite' : type === 'leaf'
}

/**
 * Type guard for identifying composite Where nodes.
 *
 * Example usage:
 * if (isWhereComposite(where)) { ... }
 */
export const isWhereComposite = is('composite')

/**
 * Type guard for identifying leaf Where nodes.
 *
 * Example usage:
 * if (isWhereLeaf(where)) { ... }
 */
export const isWhereLeaf = is('leaf')

/**
 * Runtime type guard for Where nodes.
 *
 * Validates that a given value conforms to the Where structure,
 * either as a composite node or a leaf node.
 *
 * Used to safely narrow unknown inputs into query filters.
 */

export const isWhere = (where: unknown): where is Where<any> =>
  isObject(where) &&
  (where as any).value &&
  (isWhereComposite(where as any) || isWhereLeaf(where as any))
