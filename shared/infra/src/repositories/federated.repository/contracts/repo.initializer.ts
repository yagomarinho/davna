/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, EntityContext, Repository } from '@davna/core'

export interface InitializerConfig {
  entityContext: EntityContext
}

export interface RepoInitilizer<E extends Entity> {
  (data: InitializerConfig): Repository<E>
}
