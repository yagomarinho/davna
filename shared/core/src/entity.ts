import { Identifier } from './identifier'
import { Tagged } from './tagged'
import { Timestamped } from './timestamped'
import { Version, Versionable } from './versionable'

export interface EntityProps extends Identifier, Timestamped {}

export interface Entity<T extends string = string, V extends Version = any>
  extends EntityProps, Tagged<T>, Versionable<V> {}
