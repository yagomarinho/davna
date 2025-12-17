import { deepClone } from '../utils/deep.clone'

class Person {
  constructor(public name: string) {}
  get upper() {
    return this.name.toUpperCase()
  }
}

describe('deepClone', () => {
  it('should clone primitive values by value', () => {
    expect(deepClone(null)).toBeNull()
    expect(deepClone(undefined)).toBeUndefined()
    expect(deepClone(42)).toBe(42)
    expect(deepClone('abc')).toBe('abc')
    expect(deepClone(true)).toBe(true)
    const s = Symbol('x')
    expect(deepClone(s)).toBe(s)
  })

  it('should deeply clone nested objects and arrays', () => {
    const original = { a: 1, b: { c: [1, 2, { d: 3 }] } }
    const clone = deepClone(original)

    expect(clone).toEqual(original)
    expect(clone).not.toBe(original)
    expect(clone.b).not.toBe(original.b)
    expect(clone.b.c).not.toBe(original.b.c)
    expect(clone.b.c[2]).not.toBe(original.b.c[2])
  })

  it('should clone Date objects preserving their value', () => {
    const d = new Date('2020-01-01T00:00:00Z')
    const clone = deepClone(d)
    expect(clone).not.toBe(d)
    expect(clone.getTime()).toBe(d.getTime())
  })

  it('should clone RegExp preserving source and flags', () => {
    const r = /a+b/gi
    const clone = deepClone(r)
    expect(clone).not.toBe(r)
    expect(clone.source).toBe(r.source)
    expect(clone.flags).toBe(r.flags)
    expect(clone.test('AAB')).toBe(true)
  })

  it('should clone Map including deep keys and values', () => {
    const key = { k: 1 }
    const val = { v: { x: 2 } }
    const m = new Map<any, any>([[key, val]])
    const clone = deepClone(m)

    expect(clone).not.toBe(m)
    expect(clone.size).toBe(1)

    const [clonedKey] = Array.from(clone.keys())
    const clonedVal = clone.get(clonedKey)!

    expect(clonedKey).not.toBe(key)
    expect(clonedKey).toEqual(key)
    expect(clonedVal).not.toBe(val)
    expect(clonedVal).toEqual(val)

    clonedVal.v.x = 999
    expect(val.v.x).toBe(2)
  })

  it('should clone Set including deep values', () => {
    const s = new Set<any>([{ a: { b: 1 } }, 2, 'x'])
    const clone = deepClone(s)

    expect(clone).not.toBe(s)
    expect(clone.size).toBe(3)

    const [obj] = Array.from(clone).filter(x => typeof x === 'object') as any[]
    expect(obj).toEqual({ a: { b: 1 } })
    expect(obj).not.toBe(Array.from(s).find(x => typeof x === 'object'))
    ;(obj as any).a.b = 7
    const originalObj = Array.from(s).find(x => typeof x === 'object') as any
    expect(originalObj.a.b).toBe(1)
  })

  it('should preserve prototype and getters/setters', () => {
    const p = new Person('yago')
    const clone = deepClone(p)
    expect(clone).not.toBe(p)
    expect(clone).toBeInstanceOf(Person)
    expect(clone.upper).toBe('YAGO')
  })

  it('should copy non-enumerable properties and descriptors', () => {
    const o: any = {}
    Object.defineProperty(o, 'hidden', {
      value: { z: 1 },
      enumerable: false,
      writable: false,
      configurable: false,
    })
    const sym = Symbol('secret')
    Object.defineProperty(o, sym, {
      value: 123,
      enumerable: false,
      writable: true,
      configurable: true,
    })

    const clone = deepClone(o)

    const hiddenDesc = Object.getOwnPropertyDescriptor(clone, 'hidden')!
    expect(hiddenDesc.enumerable).toBe(false)
    expect(hiddenDesc.writable).toBe(false)
    expect(hiddenDesc.configurable).toBe(false)
    expect(clone.hidden).toEqual({ z: 1 })
    expect(clone.hidden).not.toBe(o.hidden)

    const symDesc = Object.getOwnPropertyDescriptor(clone, sym)!
    expect(symDesc.enumerable).toBe(false)
    expect(symDesc.writable).toBe(true)
    expect(symDesc.configurable).toBe(true)
    expect(clone[sym]).toBe(123)
  })

  it('should preserve function references (not re-create logic)', () => {
    const fn = () => 42
    const o = { fn }
    const clone = deepClone(o)
    expect(clone.fn).toBe(fn)
    expect(clone.fn()).toBe(42)
  })

  it('should handle circular references correctly', () => {
    const a: any = { name: 'a' }
    const b: any = { name: 'b', a }
    a.b = b

    const cloneA = deepClone(a)
    expect(cloneA).not.toBe(a)
    expect(cloneA.b).not.toBe(b)
    expect(cloneA.b.a).toBe(cloneA)

    cloneA.name = 'a*'
    cloneA.b.name = 'b*'
    expect(a.name).toBe('a')
    expect(b.name).toBe('b')
  })

  it('should keep original intact when modifying clone', () => {
    const original = { x: { y: [1, 2, 3] } }
    const clone = deepClone(original)
    clone.x.y.push(4)
    expect(original.x.y).toEqual([1, 2, 3])
    expect(clone.x.y).toEqual([1, 2, 3, 4])
  })
})
