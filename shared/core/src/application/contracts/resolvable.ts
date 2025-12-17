/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents a value that may be synchronous or asynchronous.
 *
 * Allows APIs to accept either a direct value or a Promise
 * resolving to that value, enabling flexible composition.
 *
 * - E: the underlying value type
 */

export type Resolvable<E> = E | Promise<E>
