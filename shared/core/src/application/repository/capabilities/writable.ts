/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Repository } from '../contracts'

/**
 * Narrows a Repository type to its write-capable surface.
 *
 * Extracts only the write (set) operation from the repository methods,
 * while preserving repository identity and metadata.
 *
 * Useful in contexts where entities can be created or updated,
 * but other repository capabilities are intentionally restricted.
 */

export type Writable<R extends Repository> =
  R extends Repository<infer E, infer T>
    ? Omit<Repository<E, T>, 'methods'> & {
        readonly methods: {
          readonly set: R['methods']['set']
        }
      }
    : never
