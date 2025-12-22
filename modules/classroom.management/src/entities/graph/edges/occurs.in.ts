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
import { Edge, EdgeProps } from './edge'
import { MongoConverter, MongoRepository } from '@davna/infra'

export const OccursInURI = 'occurs-in'
export type OccursInURI = typeof OccursInURI

export const OccursInVersion = 'v1'
export type OccursInVersion = typeof OccursInVersion

// in occursIn
// message.id is source_id
// classroom.id is target_id
export interface OccursInProps extends EdgeProps {}

export interface OccursIn extends Edge<
  OccursInProps,
  OccursInURI,
  OccursInVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [OccursInURI]: OccursIn
  }
}

export function createOccursIn(props: OccursInProps): DraftEntity<OccursIn>
export function createOccursIn(
  props: OccursInProps,
  meta: undefined,
  _version: OccursInVersion,
): DraftEntity<OccursIn>
export function createOccursIn(
  props: OccursInProps,
  meta: EntityMeta,
  _version?: OccursInVersion,
): OccursIn
export function createOccursIn(
  { source_id, target_id }: OccursInProps,
  meta?: EntityMeta,
  _version: OccursInVersion = OccursInVersion,
): DraftEntity<OccursIn> | OccursIn {
  return createEntity(
    OccursInURI,
    _version,
    createOccursIn,
    { source_id, target_id },
    meta as any,
  )
}

const converter: MongoConverter<OccursIn> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { source_id, target_id },
  }) => ({
    id,
    data: {
      source_id,
      target_id,
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
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createOccursIn(
      { source_id, target_id },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface OccursInRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const OccursInRepository = ({
  client,
  entityContext,
}: OccursInRepositoryConfig) =>
  MongoRepository<OccursIn>({
    ...{
      uri:
        process.env.MONGODB_OCCURSIN_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_OCCURSIN_DATABASE || 'db',
      collection: process.env.MONGODB_OCCURSIN_COLLECTION || 'occurs-in',
    },
    client: client as any,
    converter,
    tag: OccursInURI,
    entityContext,
  })
