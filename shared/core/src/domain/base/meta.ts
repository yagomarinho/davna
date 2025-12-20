/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Auditable, Idempotent, Identifiable, Resource } from '../composition'

export const EntityURI = 'entity'
export type EntityURI = typeof EntityURI

/**
 * Metadata shared by all entities.
 *
 * This structure is responsible for identity, auditing
 * and resource discrimination.
 */
export interface EntityMeta
  extends Resource<EntityURI>, Identifiable, Auditable, Idempotent {}
