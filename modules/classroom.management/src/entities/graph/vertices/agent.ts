import { Entity } from '@davna/core'

export const AgentURI = 'agent'
export type AgentURI = typeof AgentURI

export interface Agent extends Entity<AgentURI> {
  name: string
}
