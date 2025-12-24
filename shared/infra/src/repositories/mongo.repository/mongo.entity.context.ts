/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  createMeta,
  DraftEntity,
  Entity,
  EntityContext,
  isEntity,
} from '@davna/core'

function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id)
}

export function mongoEntityContext(): EntityContext {
  let _key: string | undefined = undefined

  const setIdempotency: EntityContext['setIdempotency'] = key => {
    _key = key
  }

  const validateEntity: EntityContext['validateEntity'] = <E extends Entity>(
    entity: DraftEntity<E>,
  ): entity is E => isEntity(entity) && isValidObjectId(entity.meta.id)

  const _createMeta: EntityContext['createMeta'] = ({
    id = '',
    created_at,
    updated_at,
    _idempotency_key,
  } = {}) => {
    const now = new Date()
    return createMeta({
      id,
      created_at: created_at ?? now,
      updated_at: updated_at ?? now,
      _idempotency_key: _key ?? _idempotency_key ?? '',
    })
  }

  const declareEntity: EntityContext['declareEntity'] = async <
    E extends Entity,
  >(
    entity: DraftEntity<E>,
  ): Promise<E> =>
    entity._b(
      entity.props,
      await _createMeta(validateEntity(entity) ? entity.meta : {}),
    ) as any

  return {
    declareEntity,
    validateEntity,
    createMeta: _createMeta,
    setIdempotency,
  }
}
