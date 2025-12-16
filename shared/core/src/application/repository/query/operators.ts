/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type ArrayOperators = 'in' | 'not-in' | 'array-contains-any'

export type QueryOperators = 'array-contains'

export type RangeOperators = 'between'

export type ComparisonOperator = '==' | '!=' | '>' | '>=' | '<' | '<='

export type Operators =
  | ArrayOperators
  | ComparisonOperator
  | QueryOperators
  | RangeOperators
