import type { Converter } from '@davna/types'
import { MongoDBRepository, MongoClient, ObjectId } from '@davna/repositories'

import { Account } from '../entities/account'

const converter: Converter<Account> = {
  to: ({ id, ...props }: any) => ({
    ...props,
    _id: id ? ObjectId.createFromHexString(id) : new ObjectId(),
  }),
  from: ({ _id, ...raw }: any) => ({ ...raw, id: _id?.toString() ?? '' }),
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
