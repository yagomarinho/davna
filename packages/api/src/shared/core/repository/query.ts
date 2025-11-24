import { ValidObject } from '../../types'
import { Operators } from './operators'
import { Sort } from './sort'
import { Where, WhereComposite } from './where'

export interface Query<A extends ValidObject> {
  where?: Where<A>
  sorts?: Sort<A>[]
  cursor?: string // cursor identifier
  limit?: number // page_size
}

// -----------
// Helpers
// -----------

export function Query<A extends ValidObject>(
  where?: Where<A>,
  sorts?: Sort<A>[],
  cursor?: string,
  limit?: number,
): Query<A> {
  return {
    where,
    sorts,
    cursor,
    limit,
  }
}

Query.where = where
Query.sorts = sorts
Query.cursor = cursor
Query.limit = limit

function where<A extends ValidObject>(
  fieldname: keyof A,
  operator: Operators,
  value: any,
  base?: Query<A>,
): Query<A> {
  const where = { value: { fieldname, operator, value } }
  return base ? Query(where, base.sorts, base.cursor, base.limit) : Query(where)
}

function sorts<A extends ValidObject>(
  sorts: Sort<A>[],
  base?: Query<A>,
): Query<A> {
  return base
    ? Query(base.where, sorts, base.cursor, base.limit)
    : Query(undefined, sorts)
}

function cursor<A extends ValidObject>(ref: string, base?: Query<A>): Query<A> {
  return base
    ? Query(base.where, base.sorts, ref, base.limit)
    : Query(undefined, undefined, ref)
}

function limit<A extends ValidObject>(l: number, base?: Query<A>): Query<A> {
  return base
    ? Query(base.where, base.sorts, base.cursor, l)
    : Query(undefined, undefined, undefined, l)
}

// ------------
// composite
// ------------

function composite<E extends ValidObject>(
  value: 'or' | 'and',
  left: Where<E>,
  right: Where<E>,
): WhereComposite<E> {
  return {
    value,
    left,
    right,
  }
}

function and<E extends ValidObject>(
  left: Where<E>,
  right: Where<E>,
): WhereComposite<E> {
  return composite('and', left, right)
}

function or<E extends ValidObject>(
  left: Where<E>,
  right: Where<E>,
): WhereComposite<E> {
  return composite('or', left, right)
}

function _where<E extends ValidObject>(
  fieldname: keyof E,
  operator: Operators,
  value: any,
): Where<E> {
  return {
    value: {
      fieldname,
      operator,
      value,
    },
  }
}

export const Filter = {
  where: _where,
  and,
  or,
}
