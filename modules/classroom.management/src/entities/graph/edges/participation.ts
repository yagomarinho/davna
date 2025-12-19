/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

export const ParticipationURI = 'participation'
export type ParticipationURI = typeof ParticipationURI

export const ParticipationVersion = 'v1'
export type ParticipationVersion = typeof ParticipationVersion

export enum PARTICIPANTION_ROLE {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export interface ParticipationProps {
  classroom_id: string
  participant_id: string
  participation_role: PARTICIPANTION_ROLE
}

export interface Participation extends Entity<
  ParticipationProps,
  ParticipationURI,
  ParticipationVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [ParticipationURI]: Participation
  }
}

export function createParticipation(
  props: ParticipationProps,
): DraftEntity<Participation>
export function createParticipation(
  props: ParticipationProps,
  meta: undefined,
  _version: ParticipationVersion,
): DraftEntity<Participation>
export function createParticipation(
  props: ParticipationProps,
  meta: EntityMeta,
  _version?: ParticipationVersion,
): Participation
export function createParticipation(
  { classroom_id, participant_id, participation_role }: ParticipationProps,
  meta?: EntityMeta,
  _version: ParticipationVersion = ParticipationVersion,
): DraftEntity<Participation> | Participation {
  return createEntity(
    ParticipationURI,
    _version,
    createParticipation,
    { classroom_id, participant_id, participation_role },
    meta as any,
  )
}
