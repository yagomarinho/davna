/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents an object that tracks update time.
 *
 * Indicates the most recent modification timestamp and may
 * change over the object's lifecycle.
 */

export interface Upgradable {
  readonly updated_at: Date
}
