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
  const validateEntity: EntityContext['validateEntity'] = entity =>
    isEntity(entity)

  const createMeta: EntityContext['createMeta'] = async () => {
    const auth = await GCPAuth(credentials)
    // buscar quantas linhas existem no google sheets

    const now = new Date()

    return {
      id: (await getRowsCount(auth, spreadsheetId, range)).toString(),
      _r: 'entity',
      created_at: now,
      updated_at: now,
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
  }
}
