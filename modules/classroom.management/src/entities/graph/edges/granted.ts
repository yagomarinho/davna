import {
  createEntity,
  createMeta,
  DraftEntity,
  EntityContext,
  EntityMeta,
} from '@davna/core'
import { Edge, EdgeProps } from './edge'
import { MongoConverter, MongoRepository } from '@davna/infra'

export const GrantedURI = 'granted'
export type GrantedURI = typeof GrantedURI

export const GrantedVersion = 'v1'
export type GrantedVersion = typeof GrantedVersion

// in granted
// participant.id is source_id
// entitlement.id is target_id
export interface GrantedProps extends EdgeProps {
  expires_at: Date
  priority: number
}

export interface Granted extends Edge<
  GrantedProps,
  GrantedURI,
  GrantedVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [GrantedURI]: Granted
  }
}

export function createGranted(props: GrantedProps): DraftEntity<Granted>
export function createGranted(
  props: GrantedProps,
  meta: undefined,
  _version: GrantedVersion,
): DraftEntity<Granted>
export function createGranted(
  props: GrantedProps,
  meta: EntityMeta,
  _version?: GrantedVersion,
): Granted
export function createGranted(
  { source_id, target_id, expires_at, priority }: GrantedProps,
  meta?: EntityMeta,
  _version: GrantedVersion = GrantedVersion,
): DraftEntity<Granted> | Granted {
  return createEntity(
    GrantedURI,
    _version,
    createGranted,
    { source_id, target_id, expires_at, priority },
    meta as any,
  )
}

const converter: MongoConverter<Granted> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { source_id, target_id, expires_at, priority },
  }) => ({
    id,
    data: {
      source_id,
      target_id,
      expires_at,
      priority,
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
      expires_at,
      priority,
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createGranted(
      { source_id, target_id, expires_at, priority },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface GrantedRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const GrantedRepository = ({
  client,
  entityContext,
}: GrantedRepositoryConfig) =>
  MongoRepository<Granted>({
    ...{
      uri:
        process.env.MONGODB_GRANTED_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_GRANTED_DATABASE || 'db',
      collection: process.env.MONGODB_GRANTED_COLLECTION || 'granted',
    },
    client: client as any,
    converter,
    tag: GrantedURI,
    entityContext,
  })
