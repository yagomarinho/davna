export type ArrayOperators = 'in' | 'not-in' | 'array-contains-any'

export type QueryOperators = 'array-contains'

export type RangeOperators = 'between'

export type ComparisonOperator = '==' | '!=' | '>' | '>=' | '<' | '<='

export type Operators =
  | ArrayOperators
  | ComparisonOperator
  | QueryOperators
  | RangeOperators
