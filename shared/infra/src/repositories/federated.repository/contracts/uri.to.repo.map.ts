/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EntityOf, EntityURIS } from '@davna/core'
import { RepoInitilizer } from './repo.initializer'

export type URItoRepoMap<
  R extends EntityURIS[],
  V extends { [k: string]: RepoInitilizer<EntityOf<EntityURIS>> } = {},
> = 0 extends R['length']
  ? V
  : R extends [infer First, ...infer Rest]
    ? First extends EntityURIS
      ? Rest extends EntityURIS[]
        ? URItoRepoMap<
            Rest,
            V & { [K in First]: RepoInitilizer<EntityOf<First>> }
          >
        : V
      : V
    : V

export type ExtractURISfromMap<M extends URItoRepoMap<any>> =
  keyof M extends EntityURIS ? keyof M : never
