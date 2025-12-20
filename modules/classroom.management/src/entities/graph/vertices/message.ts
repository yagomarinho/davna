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

export const MessageURI = 'message'
export type MessageURI = typeof MessageURI

export const MessageVersion = 'v1'
export type MessageVersion = typeof MessageVersion

export interface MessageProps {}

export interface Message extends Entity<
  MessageProps,
  MessageURI,
  MessageVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [MessageURI]: Message
  }
}

export function createMessage(props: MessageProps): DraftEntity<Message>
export function createMessage(
  props: MessageProps,
  meta: undefined,
  _version: MessageVersion,
): DraftEntity<Message>
export function createMessage(
  props: MessageProps,
  meta?: EntityMeta,
  _version?: MessageVersion,
): Message
export function createMessage(
  props: MessageProps,
  meta?: EntityMeta,
  _version: MessageVersion = MessageVersion,
): Message {
  return createEntity(MessageURI, _version, createMessage, props, meta as any)
}

const converter: MongoConverter<Message> = {
  to: ({ _v, _t, meta: { id, created_at, updated_at, _idempotency_key } }) => ({
    id,
    data: {
      created_at,
      updated_at,
      _idempotency_key,
      __version: _v,
      __tag: _t,
    },
  }),
  from: ({
    id,
    data: { created_at, updated_at, _idempotency_key, __version },
  }) =>
    createMessage(
      {},
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface MessageRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const MessageRepository = ({
  client,
  entityContext,
}: MessageRepositoryConfig) =>
  MongoRepository<Message>({
    ...{
      uri:
        process.env.MONGODB_MESSAGE_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_MESSAGE_DATABASE || 'db',
      collection: process.env.MONGODB_MESSAGE_COLLECTION || 'messages',
    },
    client: client as any,
    converter,
    tag: MessageURI,
    entityContext,
  })
