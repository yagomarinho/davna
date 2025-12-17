/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents a semantic tag discriminator.
 *
 * Used to classify or specialize an object within the same
 * resource or domain boundary.
 */

export interface Tag<U extends string> {
  readonly _t: U
}
