/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Repository } from '../contracts'
import { Batchable, Deletable, Writable } from '../capabilities'

/**
 * Represents a repository operating in write-only mode.
 *
 * Combines write, batch, and delete capabilities while
 * intentionally excluding read and query operations.
 *
 * Useful in command-oriented or mutation-focused contexts
 * where data retrieval is not required or should be restricted.
 */

export type WriteonlyMode<R extends Repository> = Writable<R> &
  Batchable<R> &
  Deletable<R>
