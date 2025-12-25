/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Entity,
  Repository,
  EntityContext,
  QueryBuilder,
  ExtractEntityTag,
} from '@davna/core'
import { applySorts, applyWhere } from './query'
import { createEntityContext } from './create.entity.context'

/**
 * Resource identifier for in-memory repositories.
 *
 * Used to distinguish in-memory repository implementations
 * from other repository types at runtime.
 */

export const InMemoryRepositoryURI = 'in.memory.repo'
export type InMemoryRepositoryURI = typeof InMemoryRepositoryURI

/**
 * Configuration options for the in-memory repository.
 *
 * - repository: initial list of entities to populate the repository
 * - entityContext: optional `EntityContext` for generating metadata
 * - tag: optional tag identifying the kind of entity
 */

export interface InMemoryConfig<E extends Entity> {
  repository?: E[]
  entityContext?: EntityContext
  tag?: ExtractEntityTag<E>
}

/**
 * Creates an in-memory repository for testing or development.
 *
 * - Supports basic CRUD operations: `get`, `set`, `remove`
 * - Supports query with filters, sorting, cursor, and batch size
 * - Supports batch operations (`upsert` and `remove`)
 *
 * This repository does **not persist data** and is suitable for
 * temporary storage or unit tests.
 *
 * - E: the entity type managed by the repository
 */

export function InMemoryRepository<E extends Entity>({
  repository = [],
  entityContext = createEntityContext(),
  tag = 'entity' as never,
}: InMemoryConfig<E> = {}): Repository<E, InMemoryRepositoryURI> {
  let repo = [...repository]

  const get: Repository<E>['methods']['get'] = id =>
    repo.find(el => el.meta.id === id)

  const set: Repository<E>['methods']['set'] = async entity => {
    const e = await entityContext.declareEntity(entity)

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
    let next_cursor: string | undefined = undefined

    if (order_by && order_by.length) r.sort(applySorts(order_by))

    if (filter_by && filter_by.value) r = r.filter(applyWhere(filter_by))

    if (batch_size && batch_size !== Infinity) {
      const start = cursor_ref ? Number(cursor_ref) * batch_size : 0
      const end =
        (cursor_ref ? (Number(cursor_ref) + 1) * batch_size : batch_size) + 1

      r = r.slice(start, end)

      if (r.length === batch_size + 1) {
        next_cursor = ((cursor_ref ? Number(cursor_ref) : 0) + 1).toString()
        r = r.slice(0, -1)
      }
    }

    return { data: r, next_cursor }
  }

  const batch: Repository<E>['methods']['batch'] = async b => {
    const toRemoveId = b
      .filter(item => item.type === 'remove')
      .map(item => item.data)

    repo = repo.filter(el => !toRemoveId.includes(el.meta.id))

    const entities = await Promise.all(
      b
        .filter(item => item.type === 'upsert')
        .map(async el => await entityContext.declareEntity(el.data)),
    )

    const entities_id = entities.map(en => en.meta.id)

    repo = repo.filter(el => !entities_id.includes(el.meta.id)).concat(entities)

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
