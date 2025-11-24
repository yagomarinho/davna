export function deepClone<T>(value: T, cache = new WeakMap()): T {
  if (typeof value === 'object' && value !== null) {
    if (cache.has(value)) return cache.get(value)
  }

  if (typeof value !== 'object' || value === null) {
    return value
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as any
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as any
  }

  // TypedArray (inclui Buffer, Int8Array, Uint8Array, etc.)
  if (ArrayBuffer.isView(value)) {
    // DataView
    if (value instanceof DataView) {
      const bufferClone = value.buffer.slice(0)
      const result = new DataView(
        bufferClone,
        value.byteOffset,
        value.byteLength,
      )
      return result as any
    }

    // Demais TypedArrays (Uint8Array, Buffer, etc.)
    const Ctor = (value as any).constructor as {
      new (input: ArrayBufferLike | ArrayLike<number>): any
    }

    const result = new Ctor(value as any)
    // Se quiser suportar ciclos envolvendo TypedArrays, pode usar cache aqui também:
    cache.set(value as any, result)
    return result as any
  }

  // ArrayBuffer puro
  if (value instanceof ArrayBuffer) {
    const result = value.slice(0)
    cache.set(value, result as any)
    return result as any
  }

  if (value instanceof Map) {
    const result = new Map()
    cache.set(value, result)
    value.forEach((v, k) => {
      result.set(deepClone(k, cache), deepClone(v, cache))
    })
    return result as any
  }

  if (value instanceof Set) {
    const result = new Set()
    cache.set(value, result)
    value.forEach(v => {
      result.add(deepClone(v, cache))
    })
    return result as any
  }

  if (Array.isArray(value)) {
    const result: any[] = []
    cache.set(value, result)
    value.forEach((item, i) => {
      result[i] = deepClone(item, cache)
    })
    return result as any
  }

  if (typeof value === 'function') {
    return value
  }

  const proto = Object.getPrototypeOf(value)
  const result = Object.create(proto)
  cache.set(value, result)

  for (const key of Reflect.ownKeys(value)) {
    const desc = Object.getOwnPropertyDescriptor(value, key)
    if (desc) {
      if ('value' in desc) {
        desc.value = deepClone((value as any)[key], cache)
      }
      Object.defineProperty(result, key, desc)
    }
  }

  return result
}
