/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

export const ParticipantURI = 'participant'
export type ParticipantURI = typeof ParticipantURI

export const ParticipantVersion = 'v1'
export type ParticipantVersion = typeof ParticipantVersion

export interface ParticipantProps {
  type: 'costumer' | 'agent'
  subject_id: string
}

export interface Participant extends Entity<
  ParticipantProps,
  ParticipantURI,
  ParticipantVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [ParticipantURI]: Participant
  }
}

export function createParticipant(
  props: ParticipantProps,
): DraftEntity<Participant>
export function createParticipant(
  props: ParticipantProps,
  meta: undefined,
  _version: ParticipantVersion,
): DraftEntity<Participant>
export function createParticipant(
  props: ParticipantProps,
  meta: EntityMeta,
  _version?: ParticipantVersion,
): Participant
export function createParticipant(
  props: ParticipantProps,
  meta?: EntityMeta,
  _version: ParticipantVersion = ParticipantVersion,
): Participant {
  return createEntity(
    ParticipantURI,
    _version,
    createParticipant,
    props,
    meta as any,
  )
}
