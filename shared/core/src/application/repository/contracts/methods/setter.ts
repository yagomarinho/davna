/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DraftEntity, Entity } from '../../../../domain'
import { RepositoryResult } from '../types'

/**
 * Represents the write operation of a repository.
 *
 * Accepts a DraftEntity to allow creation of new entities
 * as well as updates to existing ones.
 *
 * Returns the fully persisted entity, including metadata.
 */

export interface RepositorySetter<E extends Entity> {
  (entity: DraftEntity<E>, idempotency_key: string): RepositoryResult<E>
}
