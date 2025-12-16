/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents a Reader function.
 *
 * Encapsulates a computation that depends on an environment
 * without explicitly passing it through every call.
 *
 * Commonly used to model dependency injection and
 * context-aware computations in a functional style.
 */

export interface Reader<E, A> {
  (env: E): A
}
