/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '../../../../domain'
import { RepositoryResult } from '../types'

/**
 * Represents the read operation of a repository.
 *
 * Retrieves an entity by its identifier.
 *
 * - E: the type of entity handled by the repository
 *
 * Returns:
 * - the entity if found
 * - undefined if no entity exists with the given identifier
 */

export interface RepositoryGetter<E extends Entity> {
  (id: string): RepositoryResult<E | undefined>
}
