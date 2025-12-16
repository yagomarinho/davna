/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents a ReaderTask function.
 *
 * Encapsulates an asynchronous computation that depends
 * on an environment, combining the Reader and Task patterns.
 *
 * Commonly used for async, context-aware operations such as
 * I/O, database access, or remote service calls.
 */

export interface ReaderTask<E, A> {
  (env: E): Promise<A>
}
