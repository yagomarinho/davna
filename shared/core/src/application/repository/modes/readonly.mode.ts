/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Repository } from '../contracts'
import { Queryable, Readable } from '../capabilities'

/**
 * Represents a repository operating in read-only mode.
 *
 * Combines read (get) and query capabilities while explicitly
 * excluding any write or mutation operations.
 *
 * Useful for enforcing read-only access at the type level,
 * such as in projections, queries, or reporting contexts.
 */

export type ReadonlyMode<R extends Repository> = Readable<R> & Queryable<R>
