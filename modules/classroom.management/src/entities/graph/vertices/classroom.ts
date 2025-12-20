/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  createEntity,
  createMeta,
  DraftEntity,
  Entity,
  EntityContext,
  EntityMeta,
} from '@davna/core'
import { MongoConverter, MongoRepository } from '@davna/infra'

export const ClassroomURI = 'classroom'
export type ClassroomURI = typeof ClassroomURI

export const ClassroomVersion = 'v1'
export type ClassroomVersion = typeof ClassroomVersion

export interface ClassroomProps {
  name: string
}

export interface Classroom extends Entity<
  ClassroomProps,
  ClassroomURI,
  ClassroomVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [ClassroomURI]: Classroom
  }
}

export function createClassroom(props: ClassroomProps): DraftEntity<Classroom>
export function createClassroom(
  props: ClassroomProps,
  meta: undefined,
  _version: ClassroomVersion,
): DraftEntity<Classroom>
export function createClassroom(
  props: ClassroomProps,
  meta: EntityMeta,
  _version?: ClassroomVersion,
): Classroom
export function createClassroom(
  { name }: ClassroomProps,
  meta?: EntityMeta,
  _version: ClassroomVersion = ClassroomVersion,
): DraftEntity<Classroom> | Classroom {
  return createEntity(
    ClassroomURI,
    _version,
    createClassroom,
    { name },
    meta as any,
  )
}

const converter: MongoConverter<Classroom> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { name },
  }) => ({
    id,
    data: {
      name,
      created_at,
      updated_at,
      _idempotency_key,
      __version: _v,
      __tag: _t,
    },
  }),
  from: ({
    id,
    data: { name, created_at, updated_at, _idempotency_key, __version },
  }) =>
    createClassroom(
      { name },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface ClassroomRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const ClassroomRepository = ({
  client,
  entityContext,
}: ClassroomRepositoryConfig) =>
  MongoRepository<Classroom>({
    ...{
      uri:
        process.env.MONGODB_CLASSROOM_CONNECT_URI ||
        'mongodb://localhost:27017',
      database: process.env.MONGODB_CLASSROOM_DATABASE || 'db',
      collection: process.env.MONGODB_CLASSROOM_COLLECTION || 'classrooms',
    },
    client: client as any,
    converter,
    tag: ClassroomURI,
    entityContext,
  })
