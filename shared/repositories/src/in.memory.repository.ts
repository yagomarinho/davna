/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  applyTag,
  Batch,
  Entity,
  Identifier,
  isComposite,
  Operators,
  Query,
  Repository,
  Sort,
  Where,
  WhereComposite,
  WhereLeaf,
  WriteBatchResult,
} from '@davna/core'
import { ValidObject } from '@davna/types'

export interface InMemoryConfig<E extends Entity> {
  repository?: E[]
  idProvider?: () => string
}

export function InMemoryRepository<E extends Entity>({
  repository = [],
  idProvider = Id(),
}: InMemoryConfig<E> = {}): Repository<E> {
  let repo = [...repository]

  function get(id: string) {
    return repo.find(el => el.id === id)
  }

  // Create or Save
  function set(entity: E) {
    const now = new Date()
    const e = {
      ...entity,
    } as any

    if (!entity.id) {
      e.id = idProvider()
      e.created_at = e.created_at ?? now
      e.updated_at = e.updated_at ?? now
    } else {
      repo = repo.filter(el => el.id !== e.id)
    }

    repo = repo.concat(e)

    return e
  }

  function remove({ id }: Identifier) {
    repo = repo.filter(el => el.id !== id)
  }

  function query({ where, sorts, cursor, limit }: Query<E> = {}) {
    let r = [...repo]

    if (sorts) r.sort(applySorts(sorts))

    if (where) r = r.filter(applyWhere(where))

    if (limit) {
      const start = cursor ? Number(cursor) * limit : 0
      const end = cursor ? (Number(cursor) + 1) * limit : limit

      r = r.slice(start, end)
    }

    return r
  }

  function batch(b: Batch<E>): WriteBatchResult {
    const toRemoveId = b
      .filter(item => item.type === 'remove')
      .map(item => item.data.id)

    repo = repo.filter(el => !toRemoveId.includes(el.id))

    b.filter(item => item.type === 'upsert').map(el => set(el.data))

    return { status: 'successful', time: new Date() }
  }

  return applyTag('repository')({
    get,
    set,
    remove,
    query,
    batch,
  })
}

function Id() {
  let n = 0
  return () => (n++).toString()
}

function applySorts<E extends ValidObject>(sorts: Sort<E>[]) {
  return (a: E, b: E): number =>
    sorts.reduce((v, { property, direction }) => {
      if (v !== 0) return v
      const p1 = a[property]
      const p2 = b[property]

      if (p1 > p2) return direction === 'asc' ? 1 : -1
      if (p1 < p2) return direction === 'asc' ? -1 : 1

      return 0
    }, 0)
}

function applyWhere<E extends Entity>(where: Where<E>) {
  return (entity: E) => {
    if (isComposite(where)) return applyWhereComposite(where, entity)
    return applyWhereLeaf(where as any, entity)
  }
}

function applyWhereComposite<E extends Entity>(
  where: WhereComposite<E>,
  entity: E,
) {
  if (where.value === 'or')
    return applyWhere(where.left)(entity) || applyWhere(where.right)(entity)

  return applyWhere(where.left)(entity) && applyWhere(where.right)(entity)
}

function applyWhereLeaf<E extends Entity>(where: WhereLeaf<E>, entity: E) {
  const { fieldname, operator, value } = where.value

  const prop = entity[fieldname]

  return op(operator)(prop, value)
}

function op(operator: Operators) {
  const operators = {
    '==': __eq,
    '!=': __diff,
    '>': __gt,
    '>=': __gtoe,
    '<': __lt,
    '<=': __ltoe,
    in: __in,
    'not-in': __nin,
    between: __bt,
    'array-contains': __arrc,
    'array-contains-any': __arrcany,
  }

  return operators[operator]
}

function __eq(a: any, b: any): boolean {
  return a === b
}

function __diff(a: any, b: any): boolean {
  return a !== b
}

function __gt(a: any, b: any): boolean {
  return a > b
}

function __gtoe(a: any, b: any): boolean {
  return a >= b
}

function __lt(a: any, b: any): boolean {
  return a < b
}

function __ltoe(a: any, b: any): boolean {
  return a <= b
}

function __in(a: any, b: any[]): boolean {
  return b.includes(a)
}

function __nin(a: any, b: any[]): boolean {
  return !b.includes(a)
}

function __bt(a: any, b: { start: any; end: any }): boolean {
  return b.start <= a && b.end >= a
}

function __arrc(a: any[], b: any): boolean {
  return a.includes(b)
}

function __arrcany(a: any[], b: any[]): boolean {
  return a.some(v => b.includes(v))
}
