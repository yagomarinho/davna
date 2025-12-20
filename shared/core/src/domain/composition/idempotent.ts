/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Idempotent contract.
 *
 * Marks a message, command or input as idempotent by
 * requiring a stable idempotency key.
 *
 * The presence of this contract indicates that the
 * consumer may safely retry the operation without
 * causing duplicated side effects.
 *
 * This interface does not define how the key is generated
 * nor how idempotency is enforced — only that a key
 * must be provided.
 */

export interface Idempotent {
  /**
   * Idempotency key.
   *
   * Must uniquely identify a logical operation across
   * retries and transports.
   */
  readonly _idempotency_key: string
}
