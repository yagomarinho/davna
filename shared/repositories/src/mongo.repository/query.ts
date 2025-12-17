// -------------
// Where Helpers
// -------------

import {
  isWhereComposite,
  Sort,
  Where,
  WhereComposite,
  WhereLeaf,
} from '@davna/core'
import { mongoId } from './helpers'

export function whereAdaptToFindQuery(where: Where<any>): any {
  return isWhereComposite(where)
    ? whereCompositeAdapter(where)
    : whereLeafAdapter(where)
}

export function whereCompositeAdapter(where: WhereComposite<any>) {
  const operator = where.value === 'and' ? '$and' : '$or'
  const wheres = [
    whereAdaptToFindQuery(where.left),
    whereAdaptToFindQuery(where.right),
  ]
  return { [operator]: wheres }
}

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

// -------------
// Sorts Helpers
// -------------

export function applySorts(sorts: Sort<any>[]): any {
  return sorts.reduce(
    (acc, { property, direction }) => (
      (acc[property as any] = direction === 'asc' ? 1 : -1),
      acc
    ),
    {} as any,
  )
}
