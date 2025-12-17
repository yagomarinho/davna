/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '@davna/core'

/*
 * Represents a MongoDB projection for an entity.
 *
 * Allows selecting which fields of the entity's `props` should
 * be included (1) or excluded (0) in query results.
 *
 * - E: the entity type for which the projection applies
 *
 * Important:
 *   A projection must **either include fields** (1) or **exclude fields** (0),
 *   but it **cannot mix include and exclude** in the same object,
 *   except for the `_id` field which can be excluded alongside included fields.
 *
 * Example of valid include projection:
 *   const projection: ProjectionFields<MyEntity> = {
 *     name: 1,
 *     email: 1,
 *   }
 *
 * Example of valid exclude projection:
 *   const projection: ProjectionFields<MyEntity> = {
 *     secretField: 0,
 *   }
 */

export type ProjectionFields<E extends Entity> = {
  [x in keyof E['props']]?: 0 | 1
} & { [x: string]: 0 | 1 }
