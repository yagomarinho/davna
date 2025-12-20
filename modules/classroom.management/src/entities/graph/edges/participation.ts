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

export const ParticipationURI = 'participation'
export type ParticipationURI = typeof ParticipationURI

export const ParticipationVersion = 'v1'
export type ParticipationVersion = typeof ParticipationVersion

export enum PARTICIPANT_ROLE {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

// in participation
// participant.id is source_id
// classroom.id is target_id
export interface ParticipationProps extends EdgeProps {
  participant_role: PARTICIPANT_ROLE
}

export interface Participation extends Edge<
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
  { source_id, target_id, participant_role }: ParticipationProps,
  meta?: EntityMeta,
  _version: ParticipationVersion = ParticipationVersion,
): DraftEntity<Participation> | Participation {
  return createEntity(
    ParticipationURI,
    _version,
    createParticipation,
    { source_id, target_id, participant_role },
    meta as any,
  )
}

const converter: MongoConverter<Participation> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { source_id, target_id, participant_role },
  }) => ({
    id,
    data: {
      source_id,
      target_id,
      participant_role,
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
      participant_role,
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createParticipation(
      { source_id, target_id, participant_role },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface ParticipationRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const ParticipationRepository = ({
  client,
  entityContext,
}: ParticipationRepositoryConfig) =>
  MongoRepository<Participation>({
    ...{
      uri:
        process.env.MONGODB_PARTICIPATION_CONNECT_URI ||
        'mongodb://localhost:27017',
      database: process.env.MONGODB_PARTICIPATION_DATABASE || 'db',
      collection:
        process.env.MONGODB_PARTICIPATION_COLLECTION || 'participations',
    },
    client: client as any,
    converter,
    tag: ParticipationURI,
    entityContext,
  })
