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

export const AgentURI = 'agent'
export type AgentURI = typeof AgentURI

export const AgentVersion = 'v1'
export type AgentVersion = typeof AgentVersion

export interface AgentProps {
  name: string
}

export interface Agent extends Entity<AgentProps, AgentURI, AgentVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [AgentURI]: Agent
  }
}

export function createAgent(props: AgentProps): DraftEntity<Agent>
export function createAgent(
  props: AgentProps,
  meta: undefined,
  _version: AgentVersion,
): DraftEntity<Agent>
export function createAgent(
  props: AgentProps,
  meta: EntityMeta,
  _version?: AgentVersion,
): Agent
export function createAgent(
  { name }: AgentProps,
  meta?: EntityMeta,
  _version: AgentVersion = AgentVersion,
): Agent {
  return createEntity(AgentURI, _version, createAgent, { name }, meta as any)
}

const converter: MongoConverter<Agent> = {
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
    createAgent(
      { name },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface AgentRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const AgentRepository = ({
  client,
  entityContext,
}: AgentRepositoryConfig) =>
  MongoRepository<Agent>({
    ...{
      uri: process.env.MONGODB_AGENT_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_AGENT_DATABASE || 'db',
      collection: process.env.MONGODB_AGENT_COLLECTION || 'agents',
    },
    client: client as any,
    converter,
    tag: AgentURI,
    entityContext,
  })
