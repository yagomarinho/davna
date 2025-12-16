/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValidObject } from '@davna/types'

import { Sort } from '../models/sort'
import { Query } from '../models/query'
import { Operators } from '../models/operators'
import { ExtractValueByOperator, Where } from '../models/where'
import {
  createQuery,
  isWhere,
  withCursor,
  withLimit,
  withSorts,
  withWhere,
  withWhereLeaf,
} from '../helpers'

/**
 * Function signature for applying filter conditions
 * in the query builder.
 *
 * Supports:
 * - passing a full Where tree
 * - passing field, operator, and value directly
 */

interface FilterBy<A extends ValidObject> {
  (where: Where<A>): QueryBuilder<A>
  <K extends keyof A, O extends Operators>(
    fieldname: K,
    operator: O,
    value: ExtractValueByOperator<A, O, K>,
  ): QueryBuilder<A>
}

/**
 * Function signature for applying sorting rules
 * in the query builder.
 */

interface OrderBy<A extends ValidObject> {
  (sorts: Sort<A>[]): QueryBuilder<A>
}

/**
 * Function signature for applying a cursor reference
 * in the query builder.
 */

interface Cursor<A extends ValidObject> {
  (cursor_ref: string): QueryBuilder<A>
}

/**
 * Function signature for applying a batch size limit
 * in the query builder.
 */

interface Limit<A extends ValidObject> {
  (batch_size: number): QueryBuilder<A>
}

/**
 * Fluent query builder interface.
 *
 * Enables incremental, immutable construction of queries
 * through a chained API.
 */

export interface QueryBuilder<A extends ValidObject> {
  filterBy: FilterBy<A>
  orderBy: OrderBy<A>
  cursor: Cursor<A>
  limit: Limit<A>
  build: () => Query<A>
}

/**
 * Internal factory for creating a QueryBuilder instance.
 *
 * Each operation returns a new builder with an updated
 * immutable query state.
 */

function createQueryBuilder<A extends ValidObject>(
  query: Query<A>,
): QueryBuilder<A> {
  const filterBy = ((arg1, arg2, arg3) =>
    isWhere(arg1)
      ? createQueryBuilder(withWhere(query, arg1))
      : createQueryBuilder(
          withWhereLeaf(query, arg1, arg2, arg3),
        )) as FilterBy<A>

  const orderBy: OrderBy<A> = sorts =>
    createQueryBuilder(withSorts(query, sorts))

  const cursor: Cursor<A> = cursor =>
    createQueryBuilder(withCursor(query, cursor))

  const limit: Limit<A> = limit => createQueryBuilder(withLimit(query, limit))

  const build: QueryBuilder<A>['build'] = () => query

  return {
    filterBy,
    orderBy,
    cursor,
    limit,
    build,
  }
}

/**
 * Public entry point for creating a QueryBuilder.
 *
 * Starts from an empty query with default values applied.
 */

export function QueryBuilder<A extends ValidObject>(): QueryBuilder<A> {
  return createQueryBuilder(createQuery())
}
