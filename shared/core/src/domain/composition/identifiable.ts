/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents an object that can be uniquely identified.
 *
 * The identifier must be stable and immutable for the lifetime
 * of the object.
 */

export interface Identifiable {
  readonly id: string
}
