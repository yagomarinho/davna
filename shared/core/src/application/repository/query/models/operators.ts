/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Operators for array-based queries.
 *
 * Examples:
 * - 'in': checks if a value exists within an array
 * - 'not-in': checks if a value does not exist within an array
 * - 'array-contains-any': checks if an array contains any of the specified values
 */

export type ArrayOperators = 'in' | 'not-in' | 'array-contains-any'

/**
 * Operators for query-specific checks.
 *
 * Example:
 * - 'array-contains': verifies that an array field contains a given value
 */

export type QueryOperators = 'array-contains'

/**
 * Operators for range-based comparisons.
 *
 * Example:
 * - 'between': checks if a value is within a specified range
 */

export type RangeOperators = 'between'

/**
 * Standard comparison operators.
 *
 * Examples:
 * - '==', '!=', '>', '>=', '<', '<='
 */

export type ComparisonOperator = '==' | '!=' | '>' | '>=' | '<' | '<='

/**
 * All supported operators for query construction.
 *
 * Combines array, comparison, query-specific, and range operators
 * into a single union type.
 */

export type Operators =
  | ArrayOperators
  | ComparisonOperator
  | QueryOperators
  | RangeOperators
