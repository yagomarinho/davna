/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, EntityContext, RepositoryResult } from '@davna/core'
import { RepoEntry } from './repo.entry'
import { ID } from '@davna/kernel'

export interface IDContext extends EntityContext {
  getEntityTag<T extends Entity>(entity: T): string
  getIDEntity(id: string): RepositoryResult<ID | undefined>
}

export interface FedConfig<
  R extends RepoEntry<Entity>[],
  T extends string = string,
> {
  IDContext: IDContext
  repositories: R
  tag: T
}
