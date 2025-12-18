/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MongoConverter, MongoRepository } from '@davna/infra'
import { Account, AccountURI, createAccount } from '../entities'
import { EntityContext } from '@davna/core'

const converter: MongoConverter<Account> = {
  to: ({
    _v,
    meta: { id, created_at, updated_at },
    props: { external_ref, name, roles },
  }) => ({
    id,
    data: {
      name,
      external_ref,
      roles,
      created_at,
      updated_at,
      __version: _v,
    },
  }),
  from: ({
    id,
    data: { name, external_ref, roles, created_at, updated_at, __version },
  }) =>
    createAccount(
      {
        name,
        external_ref,
        roles,
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

export interface AccountRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext?: EntityContext
}

export const AccountRepository = ({
  client,
  entityContext,
}: AccountRepositoryConfig) =>
  MongoRepository<Account>({
    ...{
      uri:
        process.env.MONGODB_ACCOUNT_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_ACCOUNT_DATABASE || 'db',
      collection: process.env.MONGODB_ACCOUNT_COLLECTION || 'accounts',
    },
    client: client as any,
    converter,
    entityContext,
    tag: AccountURI,
  })
