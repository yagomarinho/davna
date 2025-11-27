import { cloneFunction, deepClone } from '@davna/utils'

export interface Tagged<V extends string> {
  readonly __tag: V
}

export const applyTag =
  <T extends string>(tag: T) =>
  <V>(value: V): V & Tagged<T> => {
    if (typeof value === 'function') {
      const clonedValue = cloneFunction(value as any)
      apply(clonedValue)
      return clonedValue as V & Tagged<T>
    }

    if (typeof value === 'object' && value !== null) {
      const clonedValue = deepClone(value)
      apply(clonedValue)
      return clonedValue as V & Tagged<T>
    }

    function apply(v: any) {
      Reflect.defineProperty(v, '__tag', {
        value: tag,
        enumerable: true,
        configurable: false,
        writable: false,
      })
    }

    throw new Error('Invalid element to tag')
  }

export const verifyTag =
  <T extends string>(tag: T) =>
  (value: unknown): value is Tagged<T> =>
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    '__tag' in value &&
    (value as any).__tag === tag
