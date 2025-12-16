/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Represents a bounded range between two values.
 *
 * Commonly used for range-based queries or comparisons,
 * where both a start and an end value are required.
 */

export interface Range<T> {
  /** Lower bound of the range (inclusive) */
  start: T

  /** Upper bound of the range (inclusive) */
  end: T
}
