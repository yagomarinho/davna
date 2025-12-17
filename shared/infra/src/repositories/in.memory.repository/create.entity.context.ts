/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EntityContext, isEntity } from '@davna/core'

/**
 * Creates a fake `EntityContext` for testing or development purposes.
 *
 * - Generates simple incrementing IDs for entities
 * - Sets `created_at` and `updated_at` to the current timestamp
 * - Provides a basic `isValid` check using `isEntity`
 *
 * Useful for scenarios where a real `EntityContext` is not available,
 * such as unit tests or local development mocks.
 */

export function createEntityContext(): EntityContext {
  let n = 0

  const isValid: EntityContext['isValid'] = entity => isEntity(entity)

  const meta: EntityContext['meta'] = () => {
    const now = new Date()
    return {
      _r: 'entity',
      created_at: now,
      updated_at: now,
      id: (n++).toString(),
    }
  }

  return {
    isValid,
    meta,
  }
}
