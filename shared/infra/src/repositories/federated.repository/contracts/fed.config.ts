/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Entity,
  EntityContext,
  EntityURIS,
  RepositoryResult,
} from '@davna/core'
import { URItoRepoMap } from './uri.to.repo.map'
import { ID } from '@davna/kernel'

export interface IDContext extends EntityContext {
  getEntityTag<T extends Entity>(entity: T): string
  getIDEntity(id: string): RepositoryResult<ID | undefined>
}

export interface FedConfig<U extends EntityURIS[], T extends string = string> {
  repositories: URItoRepoMap<U>
  IDContext: IDContext
  tag: T
}
