/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents a version identifier.
 *
 * Versions follow a simple, explicit string format
 * to enable safe comparison and serialization.
 */

export type Version = `v${number}`

/**
 * Represents an object that carries version information.
 *
 * Used to track structural or semantic evolution over time,
 * enabling compatibility checks and migrations.
 */

export interface Versioned<U extends Version> {
  readonly _v: U
}
