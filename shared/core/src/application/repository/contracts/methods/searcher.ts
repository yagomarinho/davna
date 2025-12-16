/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '../../../../domain'
import { ExtractSearchablePropertiesFromEntity, Query } from '../../query'
import { RepositoryResult } from '../types'

/**
 * Represents the query operation of a repository.
 *
 * Retrieves a collection of entities based on
 * the provided query criteria.
 *
 * - E: the type of entity handled by the repository
 *
 * Parameters:
 * - q: optional query object defining filters, sorting,
 *      pagination, and batch size
 *
 * Returns:
 * - an array of entities matching the query
 */

export interface RepositorySearcher<E extends Entity> {
  (q?: Query<ExtractSearchablePropertiesFromEntity<E>>): RepositoryResult<E[]>
}
