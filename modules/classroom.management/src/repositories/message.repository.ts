/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Converter } from '@davna/kernel'
import { MongoClient, MongoDBRepository, ObjectId } from '@davna/infra'

import { AudioMessage, Message } from '../entities/message'

const converter: Converter<Message> = {
  to: ({ id, ...props }: any) => ({
    ...props,
    _id: id ? new ObjectId(id) : new ObjectId(),
  }),
  from: ({ _id, ...raw }: any) =>
    AudioMessage.create({ ...raw, id: _id?.toString() ?? '' }),
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
