/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '../../../../domain'
import { RepositoryResult } from '../types'

/**
 * Represents the write operation of a repository.
 *
 * Persists an entity in the underlying storage.
 *
 * The operation may create a new entity or update
 * an existing one, depending on repository semantics.
 *
 * - E: the type of entity handled by the repository
 *
 * Returns:
 * - the persisted entity, potentially enriched
 *   with updated metadata
 */

export interface RepositorySetter<E extends Entity> {
  (entity: E): RepositoryResult<E>
}
