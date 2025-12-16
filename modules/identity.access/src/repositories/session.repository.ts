/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Converter } from '@davna/types'
import { MongoClient, MongoDBRepository, ObjectId } from '@davna/repositories'

import { Session } from '../entities/session'

const converter: Converter<Session> = {
  to: ({ id, ...props }: any) => ({
    ...props,
    _id: id ? new ObjectId(id) : new ObjectId(),
  }),
  from: ({ _id, ...raw }: any) =>
    Session.create({ ...raw, id: _id?.toString() ?? '' }),
}

export interface SessionRepositoryConfig {
  client?: MongoClient
}

export const SessionRepository = ({ client }: SessionRepositoryConfig) =>
  MongoDBRepository<Session>({
    ...{
      uri:
        process.env.MONGODB_SESSION_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_SESSION_DATABASE || 'db',
      collection: process.env.MONGODB_SESSION_COLLECTION || 'session',
    },
    client: client as any,
    converter,
  })
