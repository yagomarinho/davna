/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Provides access to the current time.
 *
 * Abstracted as an interface to allow deterministic
 * testing and controlled time behavior.
 */
export interface Timestamp {
  now: () => Date
}
