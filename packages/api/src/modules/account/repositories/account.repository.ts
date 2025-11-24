import { MongoClient, ObjectId } from 'mongodb'

import config from '../../../config'

import { MongoDBRepository } from '../../../shared/repositories/mongodb.repository'
import { Converter } from '../../../shared/types'
import { Account } from '../entities/account'

const converter: Converter<Account> = {
  to: ({ id, ...props }: any) => ({
    ...props,
    _id: id ? ObjectId.createFromHexString(id) : new ObjectId(),
  }),
  from: ({ _id, ...raw }: any) => ({ ...raw, id: _id?.toString() ?? '' }),
}

export interface Config {
  client?: MongoClient
}

export const AccountRepository = ({ client }: Config) =>
  MongoDBRepository<Account>({
    ...config.databases.account,
    client: client as any,
    converter,
  })
