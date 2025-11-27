import { MongoClient, ObjectId } from 'mongodb'

import config from '../../../config'

import { MongoDBRepository } from '../../../shared/repositories/mongodb.repository'
import { Converter } from '@davna/types'
import { Message } from '../entities/message'

const converter: Converter<Message> = {
  to: ({ id, ...props }: any) => ({
    ...props,
    _id: id ? ObjectId.createFromHexString(id) : new ObjectId(),
  }),
  from: ({ _id, ...raw }: any) => ({ ...raw, id: _id?.toString() ?? '' }),
}

export interface Config {
  client?: MongoClient
}

export const MessageRepository = ({ client }: Config) =>
  MongoDBRepository<Message>({
    ...config.databases.message,
    client: client as any,
    converter,
  })
