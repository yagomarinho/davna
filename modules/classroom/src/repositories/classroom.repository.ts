import { MongoClient, ObjectId } from 'mongodb'

import config from '../../../config'

import { MongoDBRepository } from '../../../shared/repositories/mongodb.repository'
import { Converter } from '@davna/types'
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
    ...config.databases.classroom,
    client: client as any,
    converter,
  })
