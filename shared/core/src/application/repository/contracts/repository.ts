/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, Resource, Tag } from '../../../domain'

import {
  RepositoryBatcher,
  RepositoryGetter,
  RepositoryRemover,
  RepositorySearcher,
  RepositorySetter,
} from './methods'

/**
 * Resource identifier for repositories.
 *
 * Used to discriminate repository objects from other domain constructs
 * at runtime.
 */

export const RepositoryURI = 'repository'
export type RepositoryURI = typeof RepositoryURI

type ExtractEntityTag<E extends Entity> =
  E extends Entity<any, infer T> ? T : string

/**
 * Metadata associated with a repository.
 *
 * Combines resource and tag information to uniquely identify
 * the repository type at runtime.
 */

export interface RepositoryMeta<T extends string>
  extends Resource<RepositoryURI>, Tag<T> {}

/**
 * Core repository operations.
 *
 * Provides a strongly-typed interface for accessing, modifying,
 * removing, querying, and batching entities.
 */

export interface RepositoryMethods<E extends Entity = Entity> {
  readonly get: RepositoryGetter<E>
  readonly set: RepositorySetter<E>
  readonly remove: RepositoryRemover
  readonly query: RepositorySearcher<E>
  readonly batch: RepositoryBatcher<E>
}

/**
 * Core Repository contract.
 *
 * - Associates a repository with a specific entity type
 * - Exposes repository methods for controlled access
 * - Includes metadata to identify the repository and its entity tag
 */

export interface Repository<
  E extends Entity = any,
  T extends string = string,
> extends Tag<ExtractEntityTag<E>> {
  readonly methods: RepositoryMethods<E>
  readonly meta: RepositoryMeta<T>
}
