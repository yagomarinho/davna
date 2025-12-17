/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
    // DataView (já estava no seu código)
    if (value instanceof DataView) {
      const bufferClone = value.buffer.slice(0)
      const result = new DataView(
        bufferClone,
        value.byteOffset,
        value.byteLength,
      )
      cache.set(value as any, result)
      return result as any
    }

    if (
      typeof Buffer !== 'undefined' &&
      typeof (Buffer as any).isBuffer === 'function' &&
      (Buffer as any).isBuffer(value)
    ) {
      const result = (Buffer as any).from(value)
      cache.set(value as any, result)
      return result as any
    }

    const Ctor = (value as any).constructor as {
      new (input: ArrayBufferLike | ArrayLike<number>): any
    }

    const byteOffset = (value as any).byteOffset ?? 0
    const byteLength =
      (value as any).byteLength ??
      (value as any).length * ((value as any).BYTES_PER_ELEMENT || 1)
    const bufferSlice = value.buffer.slice(byteOffset, byteOffset + byteLength)

    // Construímos a nova TypedArray a partir do ArrayBuffer recortado
    const result = new Ctor(bufferSlice)
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
