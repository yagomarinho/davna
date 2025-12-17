/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, Repository } from '@davna/core'

export interface FederatedRepository<E extends Entity> extends Repository<E> {}

type RepoEntry<E extends Entity> = readonly [E['_t'], Repository<E>]

type EntitiesOf<R extends readonly RepoEntry<Entity>[]> =
  R[number] extends readonly [any, Repository<infer E>] ? E : never

interface IdStrategy {
  generate: () => string
  validate: (id: string) => boolean
}

interface Config<R extends RepoEntry<Entity>[]> {
  ids: {
    repository: Repository<ID>
    strategy: IdStrategy
  }
  repositories: R
}

export function FederatedRepository<R extends RepoEntry<Entity>[]>({
  ids,
  repositories,
}: Config<R>): FederatedRepository<EntitiesOf<R>> {
  const repoByTag = new Map<string, Repository<EntitiesOf<R>>>(
    repositories as any,
  )

  const get: FederatedRepository<EntitiesOf<R>>['get'] = async id => {
    const idEntity = await ids.repository.get(id)

    if (!idEntity) return

    const repo = repoByTag.get(idEntity.entity_tag)

    if (!repo)
      throw new Error(`No repository registered for tag "${idEntity.__tag}"`)

    const entity = await repo.get(id)

    return entity
  }

  const set: FederatedRepository<EntitiesOf<R>>['set'] = async entity => {
    const repo = repoByTag.get(entity.__tag)

    if (!repo) {
      throw new Error(`No repository registered for tag "${entity.__tag}"`)
    }

    const idEntity =
      entity.id && ids.strategy.validate(entity.id)
        ? ID.fromEntity(entity)
        : undefined

    return repo.set(entity)
  }

  const remove: FederatedRepository<EntitiesOf<R>>['remove'] = async ({
    id,
  }) => {
    for (const [, repo] of repoByTag) {
      await repo.remove({ id })
    }
  }

  const query: FederatedRepository<EntitiesOf<R>>['query'] = async query => {
    const results = await Promise.all(
      [...repoByTag.values()].map(repo => repo.query(query)),
    )
    return results.flat()
  }

  const batch: FederatedRepository<EntitiesOf<R>>['batch'] = async batch => {
    const results = await Promise.all(
      [...repoByTag.values()].map(repo => repo.batch(batch)),
    )

    if (results.some(result => result.status === 'failed'))
      return {
        status: 'failed',
        time: new Date(),
      }

    return {
      status: 'successful',
      time: new Date(),
    }
  }

  return applyTag('repository')({
    get,
    set,
    remove,
    query,
    batch,
  })
}
