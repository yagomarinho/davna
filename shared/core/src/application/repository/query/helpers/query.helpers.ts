/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Default values used when building queries.
 *
 * These provide safe fallbacks to ensure a query
 * is always structurally complete.
 */

import { ValidObject, concatenate } from '@davna/kernel'

import {
  ExtractValueByOperator,
  Operators,
  Query,
  Sort,
  Where,
} from '../models'

import { createWhereLeaf } from '../builders'

const DEFAULT_WHERE = {} as Where<any>
const DEFAULT_SORT = []
const DEFAULT_CURSOR = ''
const DEFAULT_LIMIT = Infinity

/**
 * Creates a Query object from partial input.
 *
 * Any missing properties are filled with sensible defaults,
 * allowing incremental query construction.
 */
export function createQuery<A extends ValidObject>({
  filter_by = DEFAULT_WHERE,
  order_by = DEFAULT_SORT,
  cursor_ref = DEFAULT_CURSOR,
  batch_size = DEFAULT_LIMIT,
}: Partial<Query<A>> = {}): Query<A> {
  return {
    filter_by,
    order_by,
    cursor_ref,
    batch_size,
  }
}

/**
 * Returns a new query with an additional Where leaf condition.
 *
 * Useful for incrementally adding simple filter conditions
 * without manually constructing Where nodes.
 */
export function withWhereLeaf<
  A extends ValidObject,
  O extends Operators,
  K extends keyof A,
>(
  query: Query<A>,
  fieldname: K,
  operator: O,
  value: ExtractValueByOperator<A, O, K>,
) {
  return createQuery(
    concatenate(query, {
      filter_by: createWhereLeaf(fieldname, operator, value),
    }),
  )
}

/**
 * Returns a new query with a complete Where filter applied.
 *
 * Replaces the existing filter tree with the provided one.
 */

export function withWhere<A extends ValidObject>(
  query: Query<A>,
  filter_by: Where<A>,
) {
  return createQuery(concatenate(query, { filter_by }))
}

/**
 * Returns a new query with sorting rules applied.
 *
 * Sorting rules are applied in the order provided.
 */

export function withSorts<A extends ValidObject>(
  query: Query<A>,
  order_by: Sort<A>[],
) {
  return createQuery(concatenate(query, { order_by }))
}

/**
 * Returns a new query with a cursor reference applied.
 *
 * Used for cursor-based pagination.
 */

export function withCursor<A extends ValidObject>(
  query: Query<A>,
  cursor_ref: string,
): Query<A> {
  return createQuery(concatenate(query, { cursor_ref }))
}

/**
 * Returns a new query with a batch size limit applied.
 *
 * Controls the maximum number of results returned per batch.
 */

export function withLimit<A extends ValidObject>(
  query: Query<A>,
  batch_size: number,
): Query<A> {
  return createQuery(concatenate(query, { batch_size }))
}
