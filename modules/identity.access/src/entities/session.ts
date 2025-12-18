/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

export const SessionURI = 'session'
export type SessionURI = typeof SessionURI

export const SessionVersion = 'v1'
export type SessionVersion = typeof SessionVersion

export interface SessionProps {
  account_id: string
  user_agent: string
  refresh_token: string
  expiresIn: Date
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

export function createSession(props: SessionProps): DraftEntity<Session>
export function createSession(
  props: SessionProps,
  meta: undefined,
  _version: SessionVersion,
): DraftEntity<Session>
export function createSession(
  props: SessionProps,
  meta: EntityMeta,
  _version?: SessionVersion,
): Session
export function createSession(
  { account_id, expiresIn, refresh_token, user_agent }: SessionProps,
  meta?: EntityMeta,
  _version: SessionVersion = SessionVersion,
): Session {
  return createEntity(
    SessionURI,
    _version,
    createSession,
    { account_id, expiresIn, refresh_token, user_agent },
    meta as any,
  )
}
