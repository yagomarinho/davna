/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

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
