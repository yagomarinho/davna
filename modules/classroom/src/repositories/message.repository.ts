import type { Converter } from '@davna/types'
import { MongoClient, MongoDBRepository, ObjectId } from '@davna/repositories'

import { Message } from '../entities/message'

const converter: Converter<Message> = {
  to: ({ id, ...props }: any) => ({
    ...props,
    _id: id ? new ObjectId(id) : new ObjectId(),
  }),
  from: ({ _id, ...raw }: any) => ({ ...raw, id: _id?.toString() ?? '' }),
}

export interface MessageRepositoryConfig {
  client?: MongoClient
}

export const MessageRepository = ({ client }: MessageRepositoryConfig) =>
  MongoDBRepository<Message>({
    ...{
      uri:
        process.env.MONGODB_MESSAGE_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_MESSAGE_DATABASE || 'db',
      collection: process.env.MONGODB_MESSAGE_COLLECTION || 'messages',
    },
    client: client as any,
    converter,
  })
