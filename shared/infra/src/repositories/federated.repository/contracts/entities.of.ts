/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '@davna/core'
import { RepoInitilizer } from './repo.initializer'

export type EntitiesOf<
  U extends RepoInitilizer<any>[],
  E extends Entity = never,
> = 0 extends U['length']
  ? U extends (infer F)[]
    ? F extends RepoInitilizer<infer T>
      ? T
      : never
    : never
  : U extends [infer First, ...infer Rest]
    ? First extends RepoInitilizer<infer F>
      ? Rest extends RepoInitilizer<F>[]
        ? EntitiesOf<Rest, E | F>
        : never
      : never
    : never
