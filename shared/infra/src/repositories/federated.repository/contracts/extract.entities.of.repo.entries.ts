/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, Repository } from '@davna/core'
import { RepoEntry } from './repo.entry'

export type ExtractEntitiesOfRepoEntries<
  R extends readonly RepoEntry<Entity>[],
> = R[number] extends readonly [any, Repository<infer E>] ? E : never
