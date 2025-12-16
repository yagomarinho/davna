/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Repository } from '../contracts'

/**
 * Narrows a Repository type to its batch-capable surface.
 *
 * Extracts only the batch operation from the repository methods,
 * while preserving repository identity and metadata.
 *
 * Useful in contexts where only batch processing is allowed
 * or required, enforcing stricter usage at the type level.
 */

export type Batchable<R extends Repository> =
  R extends Repository<infer E, infer T>
    ? Omit<Repository<E, T>, 'methods'> & {
        readonly methods: {
          readonly batch: R['methods']['batch']
        }
      }
    : never
