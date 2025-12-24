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
  EntityContext,
  EntityMeta,
} from '@davna/core'
import {
  AudioURI,
  ClassroomURI,
  MessageURI,
  ParticipantURI,
  TextURI,
} from '../vertices'
import { Edge, EdgeProps } from './edge'
import { MongoConverter, MongoRepository } from '@davna/infra'

export enum REPRESENTATION_TYPE {
  TRANSLATION = 'translation',
  TRANSCRIPTION = 'transcription',
  // SUMMARY = 'summary', // Aceitar outros tipos de representação no futuro
}

export const RepresentationURI = 'representation'
export type RepresentationURI = typeof RepresentationURI

export const RepresentationVersion = 'v1'
export type RepresentationVersion = typeof RepresentationVersion

// in representation
// text.id is source_id
// resource.id is target_id
export interface RepresentationProps extends EdgeProps {
  target_type: ClassroomURI | MessageURI | AudioURI | TextURI | ParticipantURI
  type: REPRESENTATION_TYPE
}

export interface Representation extends Edge<
  RepresentationProps,
  RepresentationURI,
  RepresentationVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [RepresentationURI]: Representation
  }
}

export function createRepresentation(
  props: RepresentationProps,
): DraftEntity<Representation>
export function createRepresentation(
  props: RepresentationProps,
  meta: undefined,
  _version: RepresentationVersion,
): DraftEntity<Representation>
export function createRepresentation(
  props: RepresentationProps,
  meta: EntityMeta,
  _version?: RepresentationVersion,
): Representation
export function createRepresentation(
  { source_id, target_id, target_type, type }: RepresentationProps,
  meta?: EntityMeta,
  _version: RepresentationVersion = RepresentationVersion,
): DraftEntity<Representation> | Representation {
  return createEntity(
    RepresentationURI,
    _version,
    createRepresentation,
    { source_id, target_id, target_type, type },
    meta as any,
  )
}

const converter: MongoConverter<Representation> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { source_id, target_id, target_type, type },
  }) => ({
    id,
    data: {
      source_id,
      target_id,
      target_type,
      type,
      created_at,
      updated_at,
      _idempotency_key,
      __version: _v,
      __tag: _t,
    },
  }),
  from: ({
    id,
    data: {
      source_id,
      target_id,
      target_type,
      type,
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createRepresentation(
      { source_id, target_id, target_type, type },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface RepresentationRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const RepresentationRepository = ({
  client,
  entityContext,
}: RepresentationRepositoryConfig) =>
  MongoRepository<Representation>({
    ...{
      uri:
        process.env.MONGODB_REPRESENTATION_CONNECT_URI ||
        'mongodb://localhost:27017',
      database: process.env.MONGODB_REPRESENTATION_DATABASE || 'db',
      collection:
        process.env.MONGODB_REPRESENTATION_COLLECTION || 'representations',
    },
    client: client as any,
    converter,
    tag: RepresentationURI,
    entityContext,
  })
