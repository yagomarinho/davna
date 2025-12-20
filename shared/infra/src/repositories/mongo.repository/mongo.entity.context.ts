/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DraftEntity, Entity, EntityContext, isEntity } from '@davna/core'
import { concatenate } from '@davna/kernel'

function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id)
}

export function mongoEntityContext(): EntityContext {
  const validateEntity: EntityContext['validateEntity'] = <E extends Entity>(
    entity: DraftEntity<E>,
  ): entity is E => isEntity(entity) && isValidObjectId(entity.meta.id)

  const createMeta: EntityContext['createMeta'] = ({
    id,
    created_at,
    updated_at,
    idempotency_key,
  }) => {
    const now = new Date()
    return {
      id: id ?? '',
      _r: 'entity',
      created_at: created_at ?? now,
      updated_at: updated_at ?? now,
      _idempotency_key: idempotency_key,
    }
  }

  const declareEntity: EntityContext['declareEntity'] = async <
    E extends Entity,
  >(
    entity: DraftEntity<E>,
    idempotency_key: string,
  ): Promise<E> =>
    entity._b(
      entity.props,
      await createMeta(
        concatenate(validateEntity(entity) ? entity.meta : {}, {
          idempotency_key,
        }),
      ),
    ) as any

  return {
    declareEntity,
    validateEntity,
    createMeta,
  }
}
