/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RepositoryResult } from '@davna/core'

/**
 * Federated remove contract.
 *
 * Represents a write-side facade responsible for removing
 * entities across one or more federated targets.
 *
 * This contract enforces idempotent removal by requiring
 * an explicit idempotency key for every operation, allowing
 * safe retries without duplicated side effects.
 *
 * The concrete removal strategy (hard delete, soft delete,
 * tombstoning or propagation semantics) is intentionally
 * left unspecified.
 */

export interface FederatedRemover {
  /**
   * Remove an entity by identifier.
   *
   * Executes a federated remove operation for the entity
   * identified by the given id.
   *
   * The idempotency key uniquely identifies the logical
   * removal operation and must remain stable across retries.
   */

  (id: string, idempontecy_key: string): RepositoryResult<void>
}
