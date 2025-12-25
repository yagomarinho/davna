/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EntityContext, isEntity } from '@davna/core'
import { GCPCredentials } from './gcp.credentials'
import { GCPAuth, getRowsCount } from './helpers'

interface ContextProps {
  credentials: GCPCredentials
  spreadsheetId: string
  range: string
}
export function GSRepoEntityContext({
  credentials,
  spreadsheetId,
  range,
}: ContextProps): EntityContext {
  let _key: string | undefined = undefined

  const setIdempotency: EntityContext['setIdempotency'] = key => {
    _key = key
  }

  const validateEntity: EntityContext['validateEntity'] = entity =>
    isEntity(entity)

  const createMeta: EntityContext['createMeta'] = async ({
    id,
    created_at,
    updated_at,
    _idempotency_key,
  } = {}) => {
    const auth = await GCPAuth(credentials)
    const now = new Date()
    return {
      // buscar quantas linhas existem no google sheets
      id: id ?? (await getRowsCount(auth, spreadsheetId, range)).toString(),
      _r: 'entity',
      created_at: created_at ?? now,
      updated_at: updated_at ?? now,
      _idempotency_key: _key ?? _idempotency_key ?? '',
    }
  }

  const declareEntity: EntityContext['declareEntity'] = async entity =>
    validateEntity(entity)
      ? entity
      : (entity._b(entity.props, await createMeta()) as any)

  return {
    createMeta,
    declareEntity,
    validateEntity,
    setIdempotency,
  }
}
