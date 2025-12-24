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

export const EntitlementURI = 'entitlement'
export type EntitlementURI = typeof EntitlementURI

export const EntitlementVersion = 'v1'
export type EntitlementVersion = typeof EntitlementVersion

export interface EntitlementProps {}

export interface Entitlement extends Entity<
  EntitlementProps,
  EntitlementURI,
  EntitlementVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [EntitlementURI]: Entitlement
  }
}

export function createEntitlement(
  props?: EntitlementProps,
): DraftEntity<Entitlement>
export function createEntitlement(
  props: EntitlementProps | undefined,
  meta: undefined,
  _version: EntitlementVersion,
): DraftEntity<Entitlement>
export function createEntitlement(
  props: EntitlementProps | undefined,
  meta?: EntityMeta,
  _version?: EntitlementVersion,
): Entitlement
export function createEntitlement(
  _: EntitlementProps = {},
  meta?: EntityMeta,
  _version: EntitlementVersion = EntitlementVersion,
): Entitlement {
  return createEntity(
    EntitlementURI,
    _version,
    createEntitlement,
    {},
    meta as any,
  )
}

const converter: MongoConverter<Entitlement> = {
  to: ({ _v, _t, meta: { id, created_at, updated_at, _idempotency_key } }) => ({
    id,
    data: {
      created_at,
      updated_at,
      _idempotency_key,
      __version: _v,
      __tag: _t,
    },
  }),
  from: ({
    id,
    data: { created_at, updated_at, _idempotency_key, __version },
  }) =>
    createEntitlement(
      {},
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface EntitlementRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const EntitlementRepository = ({
  client,
  entityContext,
}: EntitlementRepositoryConfig) =>
  MongoRepository<Entitlement>({
    ...{
      uri:
        process.env.MONGODB_ENTITLEMENT_CONNECT_URI ||
        'mongodb://localhost:27017',
      database: process.env.MONGODB_ENTITLEMENT_DATABASE || 'db',
      collection: process.env.MONGODB_ENTITLEMENT_COLLECTION || 'entitlements',
    },
    client: client as any,
    converter,
    tag: EntitlementURI,
    entityContext,
  })
