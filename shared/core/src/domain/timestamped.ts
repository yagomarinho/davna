/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents an object with creation timestamp information.
 *
 * Indicates when the object was initially created and should
 * never change after being set.
 */

export interface Timestamped {
  readonly created_at: Date
}
