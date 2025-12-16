/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValidObject } from '@davna/types'
import { ArrayOperators, Operators, RangeOperators } from './operators'
import { Range } from './range'

/**
 * Resolves the expected value type based on the operator used.
 *
 * Determines how the value should be structured depending
 * on the semantics of the operator.
 *
 * - Array operators expect an array of values
 * - Range operators expect a bounded range
 * - All other operators expect a single value
 */

export type ExtractValueByOperator<
  A extends ValidObject,
  O extends Operators = Operators,
  K extends keyof A = keyof A,
> = O extends ArrayOperators
  ? O extends 'array-contains-any'
    ? A[K] extends any[]
      ? A[K]
      : never
    : A[K][]
  : O extends RangeOperators
    ? Range<A[K]>
    : O extends 'array-contains'
      ? A[K] extends Array<infer T>
        ? T
        : never
      : A[K]

/**
 * Represents a condition applied to a single field in a query.
 *
 * - A: the type of object being queried
 * - O: operator used for the comparison
 * - K: key of the object being filtered
 *
 * Properties:
 * - fieldname: the field of the object to which the operator is applied
 * - operator: the comparison or array operator used
 * - value: the value to compare the field against
 */

export interface WhereValue<
  A extends ValidObject,
  O extends Operators = Operators,
  K extends keyof A = keyof A,
> {
  fieldname: K
  operator: O
  value: ExtractValueByOperator<A, O, K>
}

/**
 * Represents a single leaf node in a query filter.
 *
 * Wraps a WhereValue to allow composition in more complex queries.
 *
 * Properties:
 * - value: the atomic filtering condition for this leaf
 */
export interface WhereLeaf<
  A extends ValidObject,
  O extends Operators = Operators,
  K extends keyof A = keyof A,
> {
  value: WhereValue<A, O, K>
}

/**
 * Represents a composite query filter combining two sub-filters.
 *
 * Allows logical combination of filters using AND or OR operators.
 *
 * Properties:
 * - value: the logical operator used ('and' or 'or')
 * - left: left side of the composite filter
 * - right: right side of the composite filter
 */

export interface WhereComposite<A extends ValidObject> {
  value: 'or' | 'and'
  left: Where<A>
  right: Where<A>
}

/**
 * Represents any query filter, either a leaf or a composite.
 *
 * This type allows for nested, tree-like query conditions.
 */

export type Where<A extends ValidObject> =
  | WhereComposite<A>
  | WhereLeaf<A, Operators, keyof A>
