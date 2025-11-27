import type { Converter } from '@davna/types'
import { MongoClient, MongoDBRepository, ObjectId } from '@davna/repositories'

import { Classroom } from '../entities/classroom'

const converter: Converter<Classroom> = {
  to: ({ id, ...props }) => ({
    _id: id ? new ObjectId(id) : new ObjectId(),
    history: props.history,
    participants: props.participants,
    created_at: props.created_at,
    updated_at: new Date(),
  }),
  from: ({ _id, ...props }) =>
    Classroom.create({
      id: _id?.toString() ?? '',
      ...props,
    }),
}

export interface Config {
  client?: MongoClient
}

export const ClassroomRepository = ({ client }: Config) =>
  MongoDBRepository<Classroom>({
    ...{
      uri:
        process.env.MONGODB_CLASSROOM_CONNECT_URI ||
        'mongodb://localhost:27017',
      database: process.env.MONGODB_CLASSROOM_DATABASE || 'db',
      collection: process.env.MONGODB_CLASSROOM_COLLECTION || 'classrooms',
    },
    client: client as any,
    converter,
  })
