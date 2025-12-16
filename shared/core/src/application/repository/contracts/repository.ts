/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Query } from './query'
import { Batch, WriteBatchResult } from './batch'
import { Entity, Resource } from '../../domain'

export type RepositoryResult<E> = E | Promise<E>

export const RepositoryURI = 'repository'
export type RepositoryURI = typeof RepositoryURI

export interface Repository<
  E extends Entity = Entity,
> extends Resource<RepositoryURI> {
  readonly get: (id: string) => RepositoryResult<E | undefined>
  readonly set: (entity: E) => RepositoryResult<E>
  readonly remove: (id: string) => RepositoryResult<void>
  readonly query: (q?: Query<E>) => RepositoryResult<E[]>
  readonly batch: (b: Batch<E>) => RepositoryResult<WriteBatchResult>
}

export interface Readable<
  R extends Repository,
> extends Resource<RepositoryURI> {
  readonly get: R['get']
}
export interface Queryable<
  R extends Repository,
> extends Resource<RepositoryURI> {
  readonly query: R['query']
}

export interface Writable<
  R extends Repository,
> extends Resource<RepositoryURI> {
  readonly set: R['set']
}

export interface Batchable<
  R extends Repository,
> extends Resource<RepositoryURI> {
  readonly batch: R['batch']
}

export interface WriteonlyMode<R extends Repository>
  extends Writable<R>, Batchable<R> {}

export interface ReadonlyMode<R extends Repository>
  extends Readable<R>, Queryable<R>, Resource<RepositoryURI> {}
