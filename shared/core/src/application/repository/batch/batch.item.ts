/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '../../../domain'

/**
 * Represents a single batch operation responsible for
 * creating or updating an entity in the persistence layer.
 *
 * The operation is idempotent by nature:
 * if the entity exists, it will be updated;
 * otherwise, it will be created.
 */
export interface UpsertBatchItem<E extends Entity> {
  /** Discriminator used to identify the batch operation type */
  type: 'upsert'

  /**
   * Full entity instance to be persisted
   * The entity identifier determines whether this is an insert or an update
   */
  data: E
}

/**
 * Represents a single batch operation responsible for
 * removing an entity from the persistence layer.
 *
 * The removal is based solely on the entity identifier.
 */
export interface RemoveBatchItem {
  /** Discriminator used to identify the batch operation type */
  type: 'remove'

  /**
   * Identifier of the entity to be removed
   * No entity instance is required for this operation
   */
  data: string
}
