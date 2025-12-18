/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DraftEntity, Entity } from './entity'
import { Resolvable } from '../../application'
import { EntityMeta } from './meta'

/**
 * Entity context facade.
 *
 * Exposes controlled operations related to entity lifecycle:
 * - metadata creation
 * - structural and identity validation
 */

export interface EntityContext {
  createMeta: () => Resolvable<EntityMeta>
  declareEntity: <E extends Entity>(entity: DraftEntity<E>) => Resolvable<E>
  validateEntity: <E extends Entity>(entity: DraftEntity<E>) => entity is E
}
