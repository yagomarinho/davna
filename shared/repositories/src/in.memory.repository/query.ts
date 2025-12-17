import {
  Entity,
  isWhereComposite,
  Operators,
  Sort,
  Where,
  WhereComposite,
  WhereLeaf,
} from '@davna/core'
import { ValidObject } from '@davna/types'

export function applySorts<E extends ValidObject>(sorts: Sort<E>[]) {
  return (a: E, b: E): number =>
    sorts.reduce((v, { property, direction }) => {
      if (v !== 0) return v
      const p1 = a[property]
      const p2 = b[property]

      if (p1 > p2) return direction === 'asc' ? 1 : -1
      if (p1 < p2) return direction === 'asc' ? -1 : 1

      return 0
    }, 0)
}

export function applyWhere<E extends Entity>(where: Where<E>) {
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

  const prop = entity[fieldname]

  return op(operator)(prop, value)
}

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

function __bt(a: any, b: { start: any; end: any }): boolean {
  return b.start <= a && b.end >= a
}

function __arrc(a: any[], b: any): boolean {
  return a.includes(b)
}

function __arrcany(a: any[], b: any[]): boolean {
  return a.some(v => b.includes(v))
}
