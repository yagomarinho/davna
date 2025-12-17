/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Entity,
  ExtractSearchablePropertiesFromEntity,
  isWhereComposite,
  Operators,
  Range,
  Sort,
  Where,
  WhereComposite,
  WhereLeaf,
} from '@davna/core'

/**
 * Applies sorting rules to an array of entities.
 *
 * Returns a comparator function that can be used in `Array.prototype.sort`.
 * Sorts by multiple fields in order. Supports sorting by `props` fields
 * as well as meta fields: `id`, `created_at`, `updated_at`.
 *
 * - sorts: array of Sort objects specifying property and direction
 * - returns: comparator function (a, b) => number
 */

export function applySorts<E extends Entity>(
  sorts: Sort<ExtractSearchablePropertiesFromEntity<E>>[],
) {
  return (a: E, b: E): number =>
    sorts.reduce((v, { property, direction }) => {
      if (v !== 0) return v
      const key: 'meta' | 'props' = ['id', 'created_at', 'updated_at'].includes(
        property as any,
      )
        ? 'meta'
        : 'props'

      const p1 = a[key][property as any]
      const p2 = b[key][property as any]

      if (p1 > p2) return direction === 'asc' ? 1 : -1
      if (p1 < p2) return direction === 'asc' ? -1 : 1

      return 0
    }, 0)
}

/**
 * Creates a predicate function to filter entities according to a `Where` condition.
 *
 * - where: the condition to apply
 * - returns: function (entity) => boolean
 */

export function applyWhere<E extends Entity>(
  where: Where<ExtractSearchablePropertiesFromEntity<E>>,
) {
  return (entity: E) => {
    if (isWhereComposite(where)) return applyWhereComposite(where, entity)
    return applyWhereLeaf(where as any, entity)
  }
}

function applyWhereComposite<E extends Entity>(
  where: WhereComposite<E>,
  entity: E,
) {
  if (where.value === 'or')
    return applyWhere(where.left)(entity) || applyWhere(where.right)(entity)

  return applyWhere(where.left)(entity) && applyWhere(where.right)(entity)
}

function applyWhereLeaf<E extends Entity>(where: WhereLeaf<E>, entity: E) {
  const { fieldname, operator, value } = where.value

  const key: 'meta' | 'props' = ['id', 'created_at', 'updated_at'].includes(
    fieldname as any,
  )
    ? 'meta'
    : 'props'

  const prop = entity[key][fieldname as any]

  return op(operator)(prop, value)
}

/** Maps an operator string to a corresponding comparison function. */
function op(operator: Operators) {
  const operators = {
    '==': __eq,
    '!=': __diff,
    '>': __gt,
    '>=': __gtoe,
    '<': __lt,
    '<=': __ltoe,
    in: __in,
    'not-in': __nin,
    between: __bt,
    'array-contains': __arrc,
    'array-contains-any': __arrcany,
  }

  return operators[operator]
}

// Comparison operator implementations
function __eq(a: any, b: any): boolean {
  return a === b
}

function __diff(a: any, b: any): boolean {
  return a !== b
}

function __gt(a: any, b: any): boolean {
  return a > b
}

function __gtoe(a: any, b: any): boolean {
  return a >= b
}

function __lt(a: any, b: any): boolean {
  return a < b
}

function __ltoe(a: any, b: any): boolean {
  return a <= b
}

function __in(a: any, b: any[]): boolean {
  return b.includes(a)
}

function __nin(a: any, b: any[]): boolean {
  return !b.includes(a)
}

function __bt(a: any, b: Range<any>): boolean {
  return b.start <= a && b.end >= a
}

function __arrc(a: any[], b: any): boolean {
  return a.includes(b)
}

function __arrcany(a: any[], b: any[]): boolean {
  return a.some(v => b.includes(v))
}
