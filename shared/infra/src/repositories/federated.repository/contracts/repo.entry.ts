/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, ExtractEntityTag } from '@davna/core'
import { RepoInitilizer } from './repo.initializer'

export type RepoEntry<E extends Entity> = readonly [
  ExtractEntityTag<E>,
  RepoInitilizer<E>,
]
