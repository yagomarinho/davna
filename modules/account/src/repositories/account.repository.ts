import type { Converter } from '@davna/types'
import { MongoDBRepository, MongoClient, ObjectId } from '@davna/repositories'

import { Account } from '../entities/account'
import { createAccount } from '../entities/account/factory'

const converter: Converter<Account> = {
  to: ({
    id,
    name,
    external_ref,
    roles,
    created_at,
    updated_at,
    __version,
  }) => ({
    _id: id ? new ObjectId(id) : new ObjectId(),
    name,
    external_ref,
    roles,
    created_at,
    updated_at,
    __version,
  }),
  from: ({
    _id,
    name,
    external_ref,
    roles,
    created_at,
    updated_at,
    __version,
  }) =>
    createAccount({
      id: _id?.toString() ?? '',
      name,
      external_ref,
      roles,
      created_at,
      updated_at,
      __version,
    }),
}

export interface AccountRepositoryConfig {
  client?: MongoClient
}

export const AccountRepository = ({ client }: AccountRepositoryConfig) =>
  MongoDBRepository<Account>({
    ...{
      uri:
        process.env.MONGODB_ACCOUNT_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_ACCOUNT_DATABASE || 'db',
      collection: process.env.MONGODB_ACCOUNT_COLLECTION || 'accounts',
    },
    client: client as any,
    converter,
  })
