/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Converter } from '@davna/kernel'
import { MongoClient, MongoDBRepository, ObjectId } from '@davna/infra'

import { Audio } from '../entities/audio'

const converter: Converter<Audio> = {
  to: ({ id, ...props }: any) => ({
    ...props,
    _id: id ? new ObjectId(id) : new ObjectId(),
  }),
  from: ({ _id, ...raw }: any) =>
    Audio.create({ ...raw, id: _id?.toString() ?? '' }),
}

export interface AudioRepositoryConfig {
  client?: MongoClient
}

export const AudioRepository = ({ client }: AudioRepositoryConfig) =>
  MongoDBRepository<Audio>({
    ...{
      uri: process.env.MONGODB_AUDIO_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_AUDIO_DATABASE || 'db',
      collection: process.env.MONGODB_AUDIO_COLLECTION || 'audios',
    },
    client: client as any,
    converter,
  })
