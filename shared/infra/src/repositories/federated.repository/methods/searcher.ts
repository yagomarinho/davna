/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Entity,
  EntityOf,
  ExtractEntityTag,
  ExtractSearchablePropertiesFromEntity,
  Query,
  RepositoryResult,
} from '@davna/core'

/**
 * Federated search contract.
 *
 * Represents a callable search facade capable of querying
 * entities across one or more federated sources.
 *
 * This contract supports:
 * - unfiltered searches returning all accessible entities
 * - property-based queries scoped to a specific entity type
 * - tagged queries that narrow the search to a concrete
 *   entity variant within a polymorphic entity set
 *
 * The concrete resolution strategy (fan-out, aggregation,
 * prioritization or source selection) is left to the
 * implementing infrastructure.
 */
export interface FederatedSearcher<E extends Entity> {
  /**
   * Execute an unfiltered federated search.
   *
   * Returns all entities of the federated set that are
   * visible to the current search context.
   */
  (): RepositoryResult<E[]>

  /**
   * Execute a property-based federated search.
   *
   * Applies the provided query against the searchable
   * properties extracted from the entity type.
   */
  (
    query: Query<ExtractSearchablePropertiesFromEntity<E>>,
  ): RepositoryResult<E[]>

  /**
   * Execute a tagged federated search.
   *
   * Restricts the search to a concrete entity variant,
   * identified by the given entity tag, and applies the
   * provided query to that variant's searchable properties.
   */
  <F extends ExtractEntityTag<E> = ExtractEntityTag<E>>(
    q: Query<ExtractSearchablePropertiesFromEntity<EntityOf<F>>>,
    tag: F,
  ): RepositoryResult<EntityOf<F>[]>
}
