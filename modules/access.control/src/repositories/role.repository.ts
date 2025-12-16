/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Converter } from '@davna/types'
import { MongoDBRepository, MongoClient, ObjectId } from '@davna/repositories'
import { Role } from '../entities'

const converter: Converter<Role> = {
  to: ({ id, name, description, created_at, updated_at, __version }) => ({
    _id: id ? new ObjectId(id) : new ObjectId(),
    name,
    description,
    created_at,
    updated_at,
    __version,
  }),
  from: ({ _id, name, description, created_at, updated_at }) =>
    Role.create({
      id: _id?.toString() ?? '',
      name,
      description,
      created_at,
      updated_at,
    }),
}

export interface RoleRepositoryConfig {
  client?: MongoClient
}

export const RoleRepository = ({ client }: RoleRepositoryConfig) =>
  MongoDBRepository<Role>({
    ...{
      uri: process.env.MONGODB_ROLE_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_ROLE_DATABASE || 'db',
      collection: process.env.MONGODB_ROLE_COLLECTION || 'roles',
    },
    client: client as any,
    converter,
  })
