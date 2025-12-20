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
import { AudioURI, ClassroomURI, MessageURI, TextURI } from '../vertices'
import { Edge, EdgeProps } from './edge'
import { MongoConverter, MongoRepository } from '@davna/infra'

export const OwnershipURI = 'ownership'
export type OwnershipURI = typeof OwnershipURI

export const OwnershipVersion = 'v1'
export type OwnershipVersion = typeof OwnershipVersion

// in ownership
// participant.id is source_id
// resource.id is target_id
export interface OwnershipProps extends EdgeProps {
  target_type: ClassroomURI | MessageURI | AudioURI | TextURI
}

export interface Ownership extends Edge<
  OwnershipProps,
  OwnershipURI,
  OwnershipVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [OwnershipURI]: Ownership
  }
}
export function createOwnership(props: OwnershipProps): DraftEntity<Ownership>
export function createOwnership(
  props: OwnershipProps,
  meta: undefined,
  _version: OwnershipVersion,
): DraftEntity<Ownership>
export function createOwnership(
  props: OwnershipProps,
  meta: EntityMeta,
  _version?: OwnershipVersion,
): Ownership
export function createOwnership(
  { source_id, target_id, target_type }: OwnershipProps,
  meta?: EntityMeta,
  _version: OwnershipVersion = OwnershipVersion,
): DraftEntity<Ownership> | Ownership {
  return createEntity(
    OwnershipURI,
    _version,
    createOwnership,
    { source_id, target_id, target_type },
    meta as any,
  )
}

const converter: MongoConverter<Ownership> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { source_id, target_id, target_type },
  }) => ({
    id,
    data: {
      source_id,
      target_id,
      target_type,
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
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createOwnership(
      { source_id, target_id, target_type },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface OwnershipRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const OwnershipRepository = ({
  client,
  entityContext,
}: OwnershipRepositoryConfig) =>
  MongoRepository<Ownership>({
    ...{
      uri:
        process.env.MONGODB_OWNERSHIP_CONNECT_URI ||
        'mongodb://localhost:27017',
      database: process.env.MONGODB_OWNERSHIP_DATABASE || 'db',
      collection: process.env.MONGODB_OWNERSHIP_COLLECTION || 'ownerships',
    },
    client: client as any,
    converter,
    tag: OwnershipURI,
    entityContext,
  })
