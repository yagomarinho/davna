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
  EntityOf,
  ExtractEntityTag,
  ExtractSearchablePropertiesFromEntity,
  Query,
  Repository,
  RepositoryResult,
  Resolvable,
  Tag,
} from '@davna/core'
import { FedConfig, RepoInitilizer } from './contracts'

export const FedetaredURI = 'federated.repository'
export type FedetaredURI = typeof FedetaredURI

type RepoMap<E extends Entity> = Map<string, Repository<E>>

type EntitiesOf<
  U extends RepoInitilizer<any>[],
  E extends Entity = never,
> = 0 extends U['length']
  ? U extends (infer F)[]
    ? F extends RepoInitilizer<infer T>
      ? T
      : never
    : never
  : U extends [infer First, ...infer Rest]
    ? First extends RepoInitilizer<infer F>
      ? Rest extends RepoInitilizer<F>[]
        ? EntitiesOf<Rest, E | F>
        : never
      : never
    : never

interface FederatedQueryMethod<E extends Entity> {
  (): RepositoryResult<E[]>
  (
    query: Query<ExtractSearchablePropertiesFromEntity<E>>,
  ): RepositoryResult<E[]>
  <F extends ExtractEntityTag<E> = ExtractEntityTag<E>>(
    q: Query<ExtractSearchablePropertiesFromEntity<EntityOf<F>>>,
    tag: F,
  ): RepositoryResult<EntityOf<F>[]>
}

export interface FederatedRepository<
  E extends Entity,
  T extends string = string,
>
  extends Omit<Repository<E, FedetaredURI>, '_t'>, Tag<T> {
  methods: Omit<Repository<E>['methods'], 'set' | 'query'> & {
    set: <F extends E>(entity: DraftEntity<F>) => RepositoryResult<F>
    query: FederatedQueryMethod<E>
  }
}

export function FederatedRepository<
  U extends RepoInitilizer<any>[],
  T extends string = string,
>({
  IDContext,
  repositories,
  tag,
}: FedConfig<U, T>): FederatedRepository<EntitiesOf<U>> {
  const repoByTag: RepoMap<EntitiesOf<U>> = new Map(
    repositories.map(init => {
      const repo = init({ entityContext: IDContext })
      return [repo._t, repo]
    }),
  )

  const get: FederatedRepository<
    EntitiesOf<U>
  >['methods']['get'] = async id => {
    const idEntity = await IDContext.getIDEntity(id)
    if (!idEntity) return

    const repo = resolveRepo(idEntity.props.entity_tag)

    return repo.methods.get(id)
  }

  const set: FederatedRepository<EntitiesOf<U>>['methods']['set'] = async <
    F extends EntitiesOf<U>,
  >(
    entity: DraftEntity<F>,
  ) => {
    const repo = resolveRepo(entity._t)
    return repo.methods.set(entity) as F
  }

  const remove: FederatedRepository<
    EntitiesOf<U>
  >['methods']['remove'] = async id => {
    const idEntity = await IDContext.getIDEntity(id)
    if (!idEntity) return

    const repo = resolveRepo(idEntity.props.entity_tag)

    await repo.methods.remove(id)
  }

  const query: FederatedRepository<EntitiesOf<U>>['methods']['query'] = async <
    F extends EntitiesOf<U> = EntitiesOf<U>,
  >(
    q?: Query<ExtractSearchablePropertiesFromEntity<F>>,
    tag?: ExtractEntityTag<F>,
  ) => {
    if (tag) {
      const repo = resolveRepo(tag)
      return repo.methods.query(q) as F[]
    }

    const results = await Promise.all(
      [...repoByTag.values()].map(repo => repo.methods.query(q)),
    )
    return results.flat() as EntitiesOf<U>[]
  }

  const batch: FederatedRepository<
    EntitiesOf<U>
  >['methods']['batch'] = async batch => {
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
      new Map() as Resolvable<Map<string, Batch<EntitiesOf<U>>>>,
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
