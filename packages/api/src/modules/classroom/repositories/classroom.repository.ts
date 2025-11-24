import { MongoClient, ObjectId } from 'mongodb'

import config from '../../../config'

import { MongoDBRepository } from '../../../shared/repositories/mongodb.repository'
import { Converter } from '../../../shared/types'
import { Classroom } from '../entities/classroom'

const converter: Converter<Classroom> = {
  to: ({ id, ...props }: any) => ({
    ...props,
    _id: id ? ObjectId.createFromHexString(id) : new ObjectId(),
  }),
  from: ({ _id, ...raw }: any) => ({ ...raw, id: _id?.toString() ?? '' }),
}

export interface Config {
  client?: MongoClient
}

export const ClassroomRepository = ({ client }: Config) =>
  MongoDBRepository<Classroom>({
    ...config.databases.classroom,
    client: client as any,
    converter,
  })
