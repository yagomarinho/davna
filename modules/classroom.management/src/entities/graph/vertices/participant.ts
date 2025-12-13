import { Entity } from '@davna/core'

export const ParticipantURI = 'participant'
export type ParticipantURI = typeof ParticipantURI

export interface Participant extends Entity<ParticipantURI> {
  type: 'costumer' | 'agent'
  subject_id: string
}
