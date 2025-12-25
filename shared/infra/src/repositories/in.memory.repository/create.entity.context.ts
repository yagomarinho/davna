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
  let _key: string | undefined = undefined

  const setIdempotency: EntityContext['setIdempotency'] = key => {
    _key = key
  }

  const validateEntity: EntityContext['validateEntity'] = entity =>
    isEntity(entity)

  const createMeta: EntityContext['createMeta'] = ({
    id,
    created_at,
    updated_at,
    _idempotency_key,
  } = {}) => {
    const now = new Date()
    return {
      id: id ?? (n++).toString(),
      _r: 'entity',
      created_at: created_at ?? now,
      updated_at: updated_at ?? now,
      _idempotency_key: _key ?? _idempotency_key ?? '',
    }
  }

  const declareEntity: EntityContext['declareEntity'] = async entity =>
    entity._b(
      entity.props,
      await createMeta(validateEntity(entity) ? entity.meta : {}),
    ) as any

  return {
    declareEntity,
    createMeta,
    validateEntity,
    setIdempotency,
  }
}
