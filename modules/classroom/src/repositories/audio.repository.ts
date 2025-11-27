import type { Converter } from '@davna/types'
import { MongoClient, MongoDBRepository, ObjectId } from '@davna/repositories'

import { Audio } from '../entities/audio'

const converter: Converter<Audio> = {
  to: ({ id, ...props }: any) => ({
    ...props,
    _id: id ? ObjectId.createFromHexString(id) : new ObjectId(),
  }),
  from: ({ _id, ...raw }: any) => ({ ...raw, id: _id?.toString() ?? '' }),
}

export interface Config {
  client?: MongoClient
}

export const AudioRepository = ({ client }: Config) =>
  MongoDBRepository<Audio>({
    ...{
      uri: process.env.MONGODB_AUDIO_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_AUDIO_DATABASE || 'db',
      collection: process.env.MONGODB_AUDIO_COLLECTION || 'audios',
    },
    client: client as any,
    converter,
  })
