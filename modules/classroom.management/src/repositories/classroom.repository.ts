import type { Converter } from '@davna/types'
import { MongoClient, MongoDBRepository, ObjectId } from '@davna/repositories'

import { Classroom } from '../entities/classroom'

const converter: Converter<Classroom> = {
  to: ({
    id,
    owner_id,
    history,
    participants,
    created_at,
    updated_at,
    __version,
  }) => ({
    _id: id ? new ObjectId(id) : new ObjectId(),
    owner_id,
    history,
    participants,
    created_at,
    updated_at,
    __version,
  }),
  from: ({ _id, ...props }) =>
    Classroom.create({
      id: _id?.toString() ?? '',
      ...props,
    }),
}

export interface ClassroomRepositoryConfig {
  client?: MongoClient
}

export const ClassroomRepository = ({ client }: ClassroomRepositoryConfig) =>
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
