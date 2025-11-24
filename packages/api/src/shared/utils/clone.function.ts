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
