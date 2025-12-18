/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EntityContext } from '@davna/core'
import { createRole, Role, RoleURI } from '../entities'
import { MongoRepository, MongoConverter } from '@davna/infra'

const converter: MongoConverter<Role> = {
  to: ({
    _v,
    props: { name, description },
    meta: { id, created_at, updated_at },
  }) => ({
    id,
    data: {
      name,
      description,
      created_at,
      updated_at,
      __version: _v,
    },
  }),
  from: ({
    id,
    data: { name, description, created_at, updated_at, __version },
  }) =>
    createRole(
      {
        name,
        description,
      },
      {
        id,
        _r: 'entity',
        created_at,
        updated_at,
      },
      __version,
    ),
}

export interface RoleRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext?: EntityContext
}

export const RoleRepository = ({
  client,
  entityContext,
}: RoleRepositoryConfig) =>
  MongoRepository<Role>({
    ...{
      uri: process.env.MONGODB_ROLE_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_ROLE_DATABASE || 'db',
      collection: process.env.MONGODB_ROLE_COLLECTION || 'roles',
    },
    converter,
    client: client as any,
    tag: RoleURI as RoleURI,
    entityContext,
  })
