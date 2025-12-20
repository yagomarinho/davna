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
import { AudioURI, TextURI } from '../vertices'
import { Edge, EdgeProps } from './edge'
import { MongoConverter, MongoRepository } from '@davna/infra'

export const SourceURI = 'source'
export type SourceURI = typeof SourceURI

export const SourceVersion = 'v1'
export type SourceVersion = typeof SourceVersion

// in source
// source.id is source_id
// message.id is target_id
export interface SourceProps extends EdgeProps {
  source_type: AudioURI | TextURI
}

export interface Source extends Edge<SourceProps, SourceURI, SourceVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [SourceURI]: Source
  }
}

export function createSource(props: SourceProps): DraftEntity<Source>
export function createSource(
  props: SourceProps,
  meta: undefined,
  _version: SourceVersion,
): DraftEntity<Source>
export function createSource(
  props: SourceProps,
  meta: EntityMeta,
  _version?: SourceVersion,
): Source
export function createSource(
  { source_id, target_id, source_type }: SourceProps,
  meta?: EntityMeta,
  _version: SourceVersion = SourceVersion,
): DraftEntity<Source> | Source {
  return createEntity(
    SourceURI,
    _version,
    createSource,
    { source_id, target_id, source_type },
    meta as any,
  )
}

const converter: MongoConverter<Source> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { source_id, target_id, source_type },
  }) => ({
    id,
    data: {
      source_id,
      target_id,
      source_type,
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
      source_type,
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createSource(
      { source_id, target_id, source_type },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface SourceRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const SourceRepository = ({
  client,
  entityContext,
}: SourceRepositoryConfig) =>
  MongoRepository<Source>({
    ...{
      uri:
        process.env.MONGODB_SOURCE_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_SOURCE_DATABASE || 'db',
      collection: process.env.MONGODB_SOURCE_COLLECTION || 'sources',
    },
    client: client as any,
    converter,
    tag: SourceURI,
    entityContext,
  })
