/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function cloneFunction<F extends (...args: any[]) => any>(fn: F): F {
  const clone = function (this: any, ...args: Parameters<F>) {
    return Reflect.apply(fn, this, args)
  }

  Reflect.ownKeys(fn).forEach(key => {
    const desc = Reflect.getOwnPropertyDescriptor(fn, key)
    if (desc) Reflect.defineProperty(clone, key, desc)
  })

  return clone as any
}
