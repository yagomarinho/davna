import { MongoClient, ObjectId } from 'mongodb'

import config from '../../../config'

import { MongoDBRepository } from '../../../shared/repositories/mongodb.repository'
import { Converter } from '../../../shared/types'
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
    ...config.databases.audio,
    client: client as any,
    converter,
  })
