import { Tagged } from './tagged'

export interface Identifier {
  readonly id: string
}

export interface Timestamp {
  created_at: Date
  updated_at: Date
}

export interface EntityProps extends Identifier, Timestamp {}

export interface Entity<V extends string = string>
  extends EntityProps,
    Tagged<V> {}
