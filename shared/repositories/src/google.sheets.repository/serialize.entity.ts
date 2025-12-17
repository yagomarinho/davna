/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '@davna/core'

/**
 * Serializes an entity into an array of JSON strings.
 *
 * Combines:
 * - entity ID
 * - all property values
 * - creation and update timestamps
 *
 * Useful for generating consistent keys, hashes,
 * or logging representations of entities.
 *
 * - E: the entity type to serialize
 */

export function serializeEntity<E extends Entity>(entity: E) {
  return [
    entity.meta.id,
    ...Object.values(entity.props),
    entity.meta.created_at,
    entity.meta.updated_at,
  ].map(v => JSON.stringify(v))
}
