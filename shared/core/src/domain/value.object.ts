import { Resource } from './resource'
import { Tag } from './tag'

export const ValueObjectURI = 'value-object'
export type ValueObjectURI = typeof ValueObjectURI

export interface ValueObjectMeta extends Resource<ValueObjectURI> {}

export interface ValueObject<
  P extends {} = {},
  T extends string = string,
> extends Tag<T> {
  meta: ValueObjectMeta
  props: Readonly<P>
}
