/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents the result of a batch operation.
 *
 * Captures the execution outcome and the time
 * at which the batch was processed.
 */

export interface BatchResult {
  /** Indicates whether the batch operation completed successfully or failed */
  status: 'successful' | 'failed'

  /** Timestamp representing when the batch operation was executed */
  time: Date
}
