/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MongoConverter, MongoRepository } from '@davna/infra'
import { createSession, Session, SessionURI } from '../entities/session'
import { createMeta, EntityContext } from '@davna/core'

const converter: MongoConverter<Session> = {
  to: ({
    _v,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { kind, metadata, expires_at, refresh_token, user_agent },
  }) => ({
    id,
    data: {
      kind,
      refresh_token,
      user_agent,
      expires_at,
      metadata: metadata.props,
      created_at,
      updated_at,
      _idempotency_key,
      __version: _v,
    },
  }),
  from: ({
    id,
    data: {
      kind,
      refresh_token,
      user_agent,
      expires_at,
      metadata,
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createSession(
      {
        kind,
        metadata,
        expires_at,
        refresh_token,
        user_agent,
      },
      createMeta({
        id,
        created_at,
        updated_at,
        _idempotency_key,
      }),
      __version,
    ),
}

export interface SessionRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext?: EntityContext
}

export const SessionRepository = ({
  client,
  entityContext,
}: SessionRepositoryConfig) =>
  MongoRepository<Session>({
    ...{
      uri:
        process.env.MONGODB_SESSION_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_SESSION_DATABASE || 'db',
      collection: process.env.MONGODB_SESSION_COLLECTION || 'session',
    },
    client: client as any,
    converter,
    tag: SessionURI,
    entityContext,
  })
