/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Batch,
  Entity,
  Repository,
  BatchResult,
  EntityContext,
  QueryBuilder,
  ExtractEntityTag,
} from '@davna/core'
import { applySorts, applyWhere } from './query'
import { createEntityContext } from './create.entity.context'

export const InMemoryRepositoryURI = 'in.memory.repo'
export type InMemoryRepositoryURI = typeof InMemoryRepositoryURI

export interface InMemoryConfig<E extends Entity> {
  repository?: E[]
  entityContext?: EntityContext
  tag?: ExtractEntityTag<E>
}

export function InMemoryRepository<E extends Entity>({
  repository = [],
  entityContext = createEntityContext(),
}: InMemoryConfig<E> = {}): Repository<E> {
  let repo = [...repository]

  const get: Repository<E>['methods']['get'] = id =>
    repo.find(el => el.meta.id === id)

  const set: Repository<E>['methods']['set'] = async entity => {
    const e: E = entity._b(
      entity.props,
      entity.meta ? entity.meta : await entityContext.meta(),
    )

    repo = repo.filter(el => el.meta.id !== e.meta.id).concat(e)

    return e
  }

  const remove: Repository<E>['methods']['remove'] = id => {
    repo = repo.filter(el => el.meta.id !== id)
  }

  const query: Repository<E>['methods']['query'] = (
    { filter_by, order_by, cursor_ref, batch_size } = QueryBuilder<E>().build(),
  ) => {
    let r = [...repo]

    if (order_by) r.sort(applySorts(order_by))

    if (filter_by) r = r.filter(applyWhere(filter_by))

    if (batch_size) {
      const start = cursor_ref ? Number(cursor_ref) * batch_size : 0
      const end = cursor_ref
        ? (Number(cursor_ref) + 1) * batch_size
        : batch_size

      r = r.slice(start, end)
    }

    return r
  }

  function batch(b: Batch<E>): BatchResult {
    const toRemoveId = b
      .filter(item => item.type === 'remove')
      .map(item => item.data)

    repo = repo.filter(el => !toRemoveId.includes(el.meta.id))

    b.filter(item => item.type === 'upsert').map(el => set(el.data))

    return { status: 'successful', time: new Date() }
  }

  return {
    _t: tag,
    meta: {
      _r: 'repository',
      _t: InMemoryRepositoryURI,
    },
    methods: {
      get,
      set,
      remove,
      query,
      batch,
    },
  }
}
