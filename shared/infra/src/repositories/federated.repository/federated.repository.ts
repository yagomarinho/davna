/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  EntitiesOf,
  FedConfig,
  RepoInitilizer,
  RepositoryPool,
} from './contracts'

import {
  Batch,
  BatchItem,
  DraftEntity,
  Entity,
  ExtractEntityTag,
  ExtractSearchablePropertiesFromEntity,
  Query,
  Repository,
  Resolvable,
} from '@davna/core'
import { FederatedRemover, FederatedSearcher, FederatedSetter } from './methods'

/*
 * Federated repository URI.
 *
 * Identifies the federated repository implementation
 * within the repository resolution system.
 */
export const FedetaredURI = 'federated.repository'
export type FedetaredURI = typeof FedetaredURI

/**
 * Federated repository contract.
 *
 * Represents a repository abstraction that operates
 * over one or more federated data sources.
 *
 * This repository:
 * - preserves the standard repository read/write surface
 * - replaces core mutation and query operations with
 *   federated-capable counterparts
 * - is identified by a dedicated repository URI
 *
 * The concrete federation model (routing, aggregation,
 * replication, consistency or conflict resolution)
 * is intentionally left to the implementation.
 *
 * - E: base entity type managed by the repository
 * - T: tag used to identify concrete entity variants
 */

export interface FederatedRepository<
  E extends Entity,
  T extends string = string,
> extends Repository<E, FedetaredURI, T> {
  /**
   * Federated repository methods.
   *
   * Overrides selected repository operations with
   * federated-aware variants while preserving the
   * remaining repository surface.
   */
  methods: Omit<Repository<E>['methods'], 'set' | 'query'> & {
    /**
     * Federated write operation.
     *
     * Persists or propagates entity drafts across
     * federated targets using idempotent semantics.
     */
    set: FederatedSetter<E>

    /**
     * Federated remove operation.
     *
     * Removes entities across federated targets
     * using idempotent semantics.
     */
    remove: FederatedRemover

    /**
     * Federated query operation.
     *
     * Executes read operations across federated
     * sources with optional scoping and tagging.
     */
    query: FederatedSearcher<E>
  }
}

export function FederatedRepository<
  U extends RepoInitilizer<any>[],
  T extends string,
>({
  tag,
  IDContext,
  repositories,
}: FedConfig<U, T>): FederatedRepository<EntitiesOf<U>, T> {
  const repoByTag: RepositoryPool<EntitiesOf<U>> = new Map(
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
    return repo.methods.set(entity)
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
  >['methods']['batch'] = async b => {
    const orderedBatch = await b.reduce(
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
      [...orderedBatch.entries()].map(async ([tag, orderedB]) => {
        const repo = resolveRepo(tag)
        return {
          ...(await repo.methods.batch(orderedB)),
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
