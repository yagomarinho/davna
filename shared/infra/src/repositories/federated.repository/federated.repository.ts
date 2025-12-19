/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Batch,
  BatchItem,
  DraftEntity,
  Entity,
  ExtractEntityTag,
  ExtractSearchablePropertiesFromEntity,
  Query,
  Repository,
  RepositoryResult,
  Resolvable,
  Tag,
} from '@davna/core'
import { ExtractEntitiesOfRepoEntries, FedConfig, RepoEntry } from './contracts'

export const FedetaredURI = 'federated.repository'
export type FedetaredURI = typeof FedetaredURI

type RepoMap<R extends RepoEntry<Entity>[]> = Map<
  string,
  Repository<ExtractEntitiesOfRepoEntries<R>>
>

interface FederatedQueryMethod<R extends RepoEntry<Entity>[]> {
  (): RepositoryResult<ExtractEntitiesOfRepoEntries<R>[]>
  (
    query: Query<
      ExtractSearchablePropertiesFromEntity<ExtractEntitiesOfRepoEntries<R>>
    >,
  ): RepositoryResult<ExtractEntitiesOfRepoEntries<R>[]>
  <E extends ExtractEntitiesOfRepoEntries<R> = ExtractEntitiesOfRepoEntries<R>>(
    q: Query<ExtractSearchablePropertiesFromEntity<E>>,
    tag: ExtractEntityTag<E>,
  ): RepositoryResult<E[]>
}

export interface FederatedRepository<
  R extends RepoEntry<Entity>[],
  T extends string = string,
>
  extends
    Omit<Repository<ExtractEntitiesOfRepoEntries<R>, FedetaredURI>, '_t'>,
    Tag<T> {
  methods: Repository<ExtractEntitiesOfRepoEntries<R>>['methods'] & {
    set: <E extends ExtractEntitiesOfRepoEntries<R>>(
      entity: DraftEntity<E>,
    ) => RepositoryResult<E>
    query: FederatedQueryMethod<R>
  }
}

export function FederatedRepository<
  R extends RepoEntry<Entity>[],
  T extends string = string,
>({ IDContext, repositories, tag }: FedConfig<R, T>): FederatedRepository<R> {
  const repoByTag: RepoMap<R> = new Map(
    repositories.map(([repoTag, repoInitializer]) => [
      repoTag,
      repoInitializer({ entityContext: IDContext }) as any,
    ]),
  )

  const get: FederatedRepository<R>['methods']['get'] = async id => {
    const idEntity = await IDContext.getIDEntity(id)
    if (!idEntity) return

    const repo = resolveRepo(idEntity.props.entity_tag)

    return repo.methods.get(id)
  }

  const set: FederatedRepository<R>['methods']['set'] = async <
    E extends ExtractEntitiesOfRepoEntries<R>,
  >(
    entity: DraftEntity<E>,
  ) => {
    const repo = resolveRepo(entity._t)
    return repo.methods.set(entity) as E
  }

  const remove: FederatedRepository<R>['methods']['remove'] = async id => {
    const idEntity = await IDContext.getIDEntity(id)
    if (!idEntity) return

    const repo = resolveRepo(idEntity.props.entity_tag)

    await repo.methods.remove(id)
  }

  const query: FederatedRepository<R>['methods']['query'] = async <
    E extends ExtractEntitiesOfRepoEntries<R> = ExtractEntitiesOfRepoEntries<R>,
  >(
    q?: Query<ExtractSearchablePropertiesFromEntity<E>>,
    tag?: ExtractEntityTag<E>,
  ) => {
    if (tag) {
      const repo = resolveRepo(tag)
      return repo.methods.query(q) as E[]
    }

    const results = await Promise.all(
      [...repoByTag.values()].map(repo => repo.methods.query(q)),
    )
    return results.flat() as E[]
  }

  const batch: FederatedRepository<R>['methods']['batch'] = async batch => {
    const orderedBatch = await batch.reduce(
      async (acc, item) => {
        if (item.type === 'upsert') {
          if (acc instanceof Promise) {
            return acc.then(mapped => {
              const tag = item.data._t
              return setBatchItem(mapped, tag, item)
            })
          }
          return setBatchItem(acc, item.data._t, item)
        } else {
          if (acc instanceof Promise) {
            return acc.then(async mapped => {
              const tag = await getTagFromId(item.data, IDContext)
              if (!tag) return mapped
              return setBatchItem(mapped, tag, item)
            })
          }
          const tag = await getTagFromId(item.data, IDContext)
          if (!tag) return acc

          return setBatchItem(acc, tag, item)
        }
      },
      new Map() as Resolvable<
        Map<string, Batch<ExtractEntitiesOfRepoEntries<R>>>
      >,
    )

    const results = await Promise.all(
      [...orderedBatch.entries()].map(async ([tag, batch]) => {
        const repo = resolveRepo(tag)
        return {
          ...(await repo.methods.batch(batch)),
          tag,
        }
      }),
    )

    if (results.some(result => result.status === 'failed'))
      return {
        status: 'failed',
        time: new Date(),
        failures: results.filter(r => r.status === 'failed').map(r => r.tag),
      }

    return {
      status: 'successful',
      time: new Date(),
    }
  }

  function resolveRepo(tag: string) {
    const repo = repoByTag.get(tag)
    if (!repo) throw new Error(`No repository registered for tag "${tag}"`)
    return repo
  }

  return {
    _t: tag,
    meta: {
      _r: 'repository',
      _t: 'federated.repository',
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

function setBatchItem(
  map: Map<string, BatchItem<any>[]>,
  tag: string,
  item: BatchItem<any>,
) {
  const repoBatch = map.get(tag) || []
  repoBatch.push(item)
  map.set(tag, repoBatch)
  return map
}

async function getTagFromId(
  id: string,
  IDContext: any,
): Promise<string | undefined> {
  const idEntity = await IDContext.getIDEntity(id)
  const tag = idEntity?.props.entity_tag
  if (!tag) return
  return tag
}
