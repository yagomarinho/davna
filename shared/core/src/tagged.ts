import { applyEntry } from '@davna/utils'

export interface Tagged<V extends string> {
  readonly __tag: V
}

export const applyTag =
  <T extends string>(tag: T) =>
  <V>(value: V): V & Tagged<T> =>
    applyEntry('__tag', tag)(value)

export const verifyTag =
  <T extends string>(tag: T) =>
  (value: unknown): value is Tagged<T> =>
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    '__tag' in value &&
    (value as any).__tag === tag
