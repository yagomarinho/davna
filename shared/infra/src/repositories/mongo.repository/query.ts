/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  isWhereComposite,
  Sort,
  Where,
  WhereComposite,
  WhereLeaf,
} from '@davna/core'
import { mongoId } from './helpers'

/**
 * Adapts a `Where` object into a MongoDB find query.
 *
 * Converts both composite and leaf conditions into MongoDB-compatible
 * query objects using `$and`, `$or`, comparison operators, and array operators.
 *
 * - where: the query condition to adapt
 * - returns: a MongoDB-compatible query object
 */

export function whereAdaptToFindQuery(where: Where<any>): any {
  return isWhereComposite(where)
    ? whereCompositeAdapter(where)
    : whereLeafAdapter(where)
}

/**
 * Adapts a composite `Where` (and/or) into MongoDB query syntax.
 *
 * - where: a composite condition with `and` or `or`
 * - returns: { $and: [...conditions] } or { $or: [...conditions] }
 */

export function whereCompositeAdapter(where: WhereComposite<any>) {
  const operator = where.value === 'and' ? '$and' : '$or'
  const wheres = [
    whereAdaptToFindQuery(where.left),
    whereAdaptToFindQuery(where.right),
  ]
  return { [operator]: wheres }
}

/**
 * Adapts a leaf `Where` condition into a MongoDB-compatible query.
 *
 * Handles field conversion (`id` → `_id`), array operators,
 * range operators (`between`), and standard comparison operators.
 */

export function whereLeafAdapter(where: WhereLeaf<any>) {
  let { fieldname, value } = where.value
  const { operator } = where.value

  if (fieldname === 'id') {
    fieldname = '_id'

    if (value instanceof Array) value = value.map(v => mongoId(v))
    if (typeof value === 'string') value = mongoId(value)
  }

  if (operator === 'array-contains') return { [fieldname]: value }

  if (operator === 'between')
    return { [fieldname]: { $gte: value.start, $lte: value.end } }

  const operatorMapper = {
    '==': '$eq',
    '!=': '$ne',
    '>': '$gt',
    '>=': '$gte',
    '<': '$lt',
    '<=': '$lte',
    in: '$in',
    'not-in': '$nin',
    'array-contains-any': '$in',
  }

  return { [fieldname]: { [operatorMapper[operator]]: value } }
}

/**
 * Converts an array of Sort objects into a MongoDB sort specification.
 *
 * - sorts: array of Sort objects { property, direction }
 * - returns: MongoDB sort object { field1: 1/-1, field2: 1/-1 }
 */

export function applySorts(sorts: Sort<any>[]): any {
  return sorts.reduce(
    (acc, { property, direction }) => (
      (acc[property as any] = direction === 'asc' ? 1 : -1),
      acc
    ),
    {} as any,
  )
}
