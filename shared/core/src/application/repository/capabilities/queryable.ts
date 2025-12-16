/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resource } from '../../../domain'
import { Repository, RepositoryURI } from '../contracts'

export interface Queryable<
  R extends Repository,
> extends Resource<RepositoryURI> {
  readonly query: R['query']
}
