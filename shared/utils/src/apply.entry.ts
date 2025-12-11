import { cloneFunction } from './clone.function'
import { deepClone } from './deep.clone'

export const applyEntry =
  <V extends string, K extends string>(key: K, value: V) =>
  <T>(target: T): T & { [key in K]: V } => {
    if (typeof target === 'function') {
      const clonedValue = cloneFunction(target as any)
      apply(clonedValue)
      return clonedValue as T & { [key in K]: V }
    }

    if (typeof target === 'object' && target !== null) {
      const clonedValue = deepClone(target)
      apply(clonedValue)
      return clonedValue as T & { [key in K]: V }
    }

    function apply(o: any) {
      Reflect.defineProperty(o, key, {
        value,
        enumerable: true,
        configurable: false,
        writable: false,
      })
    }

    throw new Error('Invalid element to tag')
  }
