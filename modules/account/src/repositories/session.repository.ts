import { MongoClient, ObjectId } from 'mongodb'

import config from '../../../config'

import { MongoDBRepository } from '../../../shared/repositories/mongodb.repository'
import { Converter } from '@davna/types'
import { Session } from '../entities/session'

const converter: Converter<Session> = {
  to: ({ id, ...props }: any) => ({
    ...props,
    _id: id ? ObjectId.createFromHexString(id) : new ObjectId(),
  }),
  from: ({ _id, ...raw }: any) => ({ ...raw, id: _id?.toString() ?? '' }),
}

export interface Config {
  client?: MongoClient
}

export const SessionRepository = ({ client }: Config) =>
  MongoDBRepository<Session>({
    ...config.databases.session,
    client: client as any,
    converter,
  })
