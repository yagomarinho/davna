/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Repository } from '../contracts'

/**
 * Narrows a Repository type to its query-capable surface.
 *
 * Extracts only the query operation from the repository methods,
 * while preserving repository identity and metadata.
 *
 * Useful in read-oriented contexts where querying is the only
 * allowed interaction with the repository.
 */

export type Queryable<R extends Repository> =
  R extends Repository<infer E, infer T>
    ? Omit<Repository<E, T>, 'methods'> & {
        readonly methods: {
          readonly query: R['methods']['query']
        }
      }
    : never
