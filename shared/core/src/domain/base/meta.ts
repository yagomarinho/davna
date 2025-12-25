/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CreateMetaParams } from '@davna/core'
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

export function createMeta({
  created_at,
  id,
  updated_at,
  _idempotency_key,
}: Required<CreateMetaParams>): EntityMeta {
  return {
    id,
    _r: 'entity',
    created_at,
    updated_at,
    _idempotency_key,
  }
}
