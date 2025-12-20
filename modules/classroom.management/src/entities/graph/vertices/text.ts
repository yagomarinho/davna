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
  RawProps,
  ValueObject,
} from '@davna/core'
import { MongoConverter, MongoRepository } from '@davna/infra'
import { Metadata } from '@davna/kernel'

export const TextURI = 'text'
export type TextURI = typeof TextURI

export const TextMetadataURI = 'text.metadata'
export type TextMetadataURI = typeof TextMetadataURI

export const TextVersion = 'v1'
export type TextVersion = typeof TextVersion

export interface TextProps {
  content: string
  metadata: ValueObject<Metadata>
}

export interface Text extends Entity<TextProps, TextURI, TextVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [TextURI]: Text
  }
}

export function createText(props: RawProps<TextProps>): DraftEntity<Text>
export function createText(
  props: RawProps<TextProps>,
  meta: undefined,
  _version: TextVersion,
): DraftEntity<Text>
export function createText(
  props: RawProps<TextProps>,
  meta: EntityMeta,
  _version?: TextVersion,
): Text
export function createText(
  { content, metadata }: RawProps<TextProps>,
  meta?: EntityMeta,
  _version: TextVersion = TextVersion,
): DraftEntity<Text> | Text {
  return _createText(
    {
      content,
      metadata: _createTextMetadata(metadata, meta?._idempotency_key ?? ''),
    },
    meta as any,
    _version,
  )
}

export function _createText(props: TextProps): DraftEntity<Text>
export function _createText(
  props: TextProps,
  meta: undefined,
  _version: TextVersion,
): DraftEntity<Text>
export function _createText(
  props: TextProps,
  meta: EntityMeta,
  _version?: TextVersion,
): Text
export function _createText(
  { content, metadata }: TextProps,
  meta?: EntityMeta,
  _version: TextVersion = TextVersion,
): DraftEntity<Text> | Text {
  return createEntity(
    TextURI,
    _version,
    _createText,
    { content, metadata },
    meta as any,
  )
}

export function _createTextMetadata(
  props: Metadata,
  _idempotency_key: string,
): ValueObject<Metadata, TextMetadataURI> {
  return ValueObject(props, _idempotency_key, TextMetadataURI)
}

const converter: MongoConverter<Text> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { content, metadata },
  }) => ({
    id,
    data: {
      content,
      metadata: metadata.props,
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
      content,
      metadata,
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createText(
      { content, metadata },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface TextRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const TextRepository = ({
  client,
  entityContext,
}: TextRepositoryConfig) =>
  MongoRepository<Text>({
    ...{
      uri: process.env.MONGODB_TEXT_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_TEXT_DATABASE || 'db',
      collection: process.env.MONGODB_TEXT_COLLECTION || 'texts',
    },
    client: client as any,
    converter,
    tag: TextURI,
    entityContext,
  })
