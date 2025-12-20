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

const converter: MongoConverter<Participant> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { subject_id, type },
  }) => ({
    id,
    data: {
      subject_id,
      type,
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
      subject_id,
      type,
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createParticipant(
      { subject_id, type },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface ParticipantRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const ParticipantRepository = ({
  client,
  entityContext,
}: ParticipantRepositoryConfig) =>
  MongoRepository<Participant>({
    ...{
      uri:
        process.env.MONGODB_PARTICIPANT_CONNECT_URI ||
        'mongodb://localhost:27017',
      database: process.env.MONGODB_PARTICIPANT_DATABASE || 'db',
      collection: process.env.MONGODB_PARTICIPANT_COLLECTION || 'participants',
    },
    client: client as any,
    converter,
    tag: ParticipantURI,
    entityContext,
  })
