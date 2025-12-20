/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DraftEntity, Entity, RepositoryResult } from '@davna/core'

/**
 * Federated write contract.
 *
 * Represents a write facade capable of persisting or
 * propagating entity changes across one or more
 * federated targets.
 *
 * This contract enforces idempotent writes by requiring
 * an explicit idempotency key for every operation.
 *
 * The concrete write strategy (routing, fan-out,
 * conflict resolution or consistency guarantees)
 * is intentionally left unspecified.
 */

export interface FederatedSetter<E extends Entity> {
  /**
   * Persist or propagate an entity draft.
   *
   * Accepts a draft entity and applies the corresponding
   * write operation to the appropriate federated target(s),
   * producing a fully resolved entity as a result.
   *
   * The idempotency key uniquely identifies the logical
   * write operation, allowing safe retries without
   * duplicated side effects.
   */

  <F extends E>(
    entity: DraftEntity<F>,
    idempontecy_key: string,
  ): RepositoryResult<F>
}
