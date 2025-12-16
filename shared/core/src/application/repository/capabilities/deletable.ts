/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Repository } from '../contracts'

/**
 * Narrows a Repository type to its delete-capable surface.
 *
 * Extracts only the remove operation from the repository methods,
 * while preserving repository identity and metadata.
 *
 * Useful in contexts where entities are allowed to be deleted
 * but other read or write capabilities are restricted.
 */

export type Deletable<R extends Repository> =
  R extends Repository<infer E, infer T>
    ? Omit<Repository<E, T>, 'methods'> & {
        readonly methods: {
          readonly remove: R['methods']['remove']
        }
      }
    : never
