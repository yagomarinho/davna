/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, EntityContext, RepositoryResult } from '@davna/core'
import { ID } from '@davna/kernel'

import { RepoInitilizer } from './repo.initializer'

export interface IDContext extends EntityContext {
  getEntityTag<T extends Entity>(entity: T): string
  getIDEntity(id: string): RepositoryResult<ID | undefined>
}

export interface FedConfig<
  U extends RepoInitilizer<any>[],
  T extends string = string,
> {
  repositories: U
  IDContext: IDContext
  tag: T
}
