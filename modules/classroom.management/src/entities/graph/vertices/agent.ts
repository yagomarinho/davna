/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

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
