/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents a typed resource discriminator.
 *
 * Used to explicitly identify the resource type at runtime,
 * enabling safe differentiation between domain structures.
 */

export interface Resource<U extends string> {
  readonly _r: U
}
