/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createRole, Role, RoleURI } from '../entities'
import { MongoRepository, MongoConverter } from '@davna/infra'

// O converter já tem que saber que é uma entity e não precisar construir uma
const converter: MongoConverter<Role> = {
  to: ({ _v, props: { name, description }, meta }) => ({
    id: meta?.id,
    data: {
      name,
      description,
      created_at: meta.created_at,
      updated_at: meta.updated_at,
      __version: _v,
    },
  }),
  from: ({ id, data: { name, description, created_at, updated_at } }) =>
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
    ),
}

export interface RoleRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
}

export const RoleRepository = ({ client }: RoleRepositoryConfig) =>
  MongoRepository<Role>({
    uri: process.env.MONGODB_ROLE_CONNECT_URI || 'mongodb://localhost:27017',
    database: process.env.MONGODB_ROLE_DATABASE || 'db',
    collection: process.env.MONGODB_ROLE_COLLECTION || 'roles',
    converter,
    tag: RoleURI as RoleURI,
    client,
  } as any)
