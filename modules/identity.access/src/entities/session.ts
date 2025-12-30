/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AuthContext,
  createEntity,
  DraftEntity,
  Entity,
  EntityMeta,
  RawProps,
  ValueObject,
} from '@davna/core'
import { Metadata } from '@davna/kernel'

export const SessionURI = 'session'
export type SessionURI = typeof SessionURI

export const SessionMetadataURI = 'session.metadata'
export type SessionMetadataURI = typeof SessionMetadataURI

export const SessionVersion = 'v1'
export type SessionVersion = typeof SessionVersion

export enum SESSION_KIND {
  GENERATED = 'generated',
  DELEGATED = 'delegated',
}

export interface SessionProps {
  kind: SESSION_KIND
  refresh_token: string
  user_agent: string
  expires_at: Date
  metadata: ValueObject<Metadata<AuthContext>, SessionMetadataURI>
}

export interface Session extends Entity<
  SessionProps,
  SessionURI,
  SessionVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [SessionURI]: Session
  }
}

export function createSession(
  props: RawProps<SessionProps>,
): DraftEntity<Session>
export function createSession(
  props: RawProps<SessionProps>,
  meta: undefined,
  _version: SessionVersion,
): DraftEntity<Session>
export function createSession(
  props: RawProps<SessionProps>,
  meta: EntityMeta,
  _version?: SessionVersion,
): Session
export function createSession(
  {
    kind,
    expires_at,
    refresh_token,
    user_agent,
    metadata,
  }: RawProps<SessionProps>,
  meta?: EntityMeta,
  _version: SessionVersion = SessionVersion,
): DraftEntity<Session> | Session {
  return _createSession(
    {
      kind,
      expires_at,
      refresh_token,
      user_agent,
      metadata: _createSessionMetadata(metadata, meta),
    },
    meta as any,
    _version,
  )
}

export function _createSession(props: SessionProps): DraftEntity<Session>
export function _createSession(
  props: SessionProps,
  meta: undefined,
  _version: SessionVersion,
): DraftEntity<Session>
export function _createSession(
  props: SessionProps,
  meta: EntityMeta,
  _version?: SessionVersion,
): Session
export function _createSession(
  { kind, expires_at, refresh_token, user_agent, metadata }: SessionProps,
  meta?: EntityMeta,
  _version: SessionVersion = SessionVersion,
): DraftEntity<Session> | Session {
  return createEntity(
    SessionURI,
    _version,
    _createSession,
    { kind, expires_at, refresh_token, user_agent, metadata },
    meta as any,
  )
}

export function _createSessionMetadata(
  props: Metadata<AuthContext>,
  meta?: EntityMeta,
): ValueObject<Metadata<AuthContext>, SessionMetadataURI> {
  return ValueObject(props, meta?._idempotency_key ?? '', SessionMetadataURI)
}
