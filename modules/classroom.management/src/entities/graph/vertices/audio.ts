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
import { MongoConverter, MongoRepository, STORAGE_TYPE } from '@davna/infra'
import { Metadata } from '@davna/kernel'

export const AudioURI = 'audio'
export type AudioURI = typeof AudioURI

export const AudioMetadataURI = 'audio.metadata'
export type AudioMetadataURI = typeof AudioMetadataURI

export const AudioStorageURI = 'audio.storage'
export type AudioStorageURI = typeof AudioStorageURI

export const AudioVersion = 'v1'
export type AudioVersion = typeof AudioVersion

export enum SUPPORTED_MIME_TYPE {
  OPUS = 'audio/webm; codecs=opus',
  WEBM = 'audio/webm',
  MP3 = 'audio/mpeg',
  MP4 = 'audio/mp4',
}
interface StorageRef {
  type: STORAGE_TYPE
  internal_id: string
  bucket: string
}

export interface AudioProps {
  status: 'presigned' | 'persistent'
  filename: string
  mime_type: string
  url: string
  duration: number // in secs
  storage: ValueObject<StorageRef>
  metadata: ValueObject<Metadata>
}

export interface Audio extends Entity<AudioProps, AudioURI, AudioVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [AudioURI]: Audio
  }
}

export function createAudio(props: RawProps<AudioProps>): DraftEntity<Audio>
export function createAudio(
  props: RawProps<AudioProps>,
  meta: undefined,
  _version: AudioVersion,
): DraftEntity<Audio>
export function createAudio(
  props: RawProps<AudioProps>,
  meta: EntityMeta,
  _version?: AudioVersion,
): Audio
export function createAudio(
  {
    status,
    filename,
    mime_type,
    url,
    duration,
    storage,
    metadata,
  }: RawProps<AudioProps>,
  meta?: EntityMeta,
  _version: AudioVersion = AudioVersion,
): DraftEntity<Audio> | Audio {
  return _createAudio(
    {
      status,
      filename,
      mime_type,
      url,
      duration,
      metadata: _createAudioMetadata(metadata, meta?._idempotency_key ?? ''),
      storage: _createAudioStorage(storage, meta?._idempotency_key ?? ''),
    },
    meta as any,
    _version,
  )
}

export function _createAudio(props: AudioProps): DraftEntity<Audio>
export function _createAudio(
  props: AudioProps,
  meta: undefined,
  _version: AudioVersion,
): DraftEntity<Audio>
export function _createAudio(
  props: AudioProps,
  meta: EntityMeta,
  _version?: AudioVersion,
): Audio
export function _createAudio(
  { status, filename, mime_type, url, duration, storage, metadata }: AudioProps,
  meta?: EntityMeta,
  _version: AudioVersion = AudioVersion,
): DraftEntity<Audio> | Audio {
  return createEntity(
    AudioURI,
    _version,
    _createAudio,
    {
      status,
      filename,
      mime_type,
      url,
      duration,
      storage,
      metadata,
    },
    meta as any,
  )
}

export function _createAudioMetadata(
  props: Metadata,
  _idempotency_key: string,
): ValueObject<Metadata, AudioMetadataURI> {
  return ValueObject(props, _idempotency_key, AudioMetadataURI)
}

export function _createAudioStorage(
  { bucket, internal_id, type }: StorageRef,
  _idempotency_key: string,
): ValueObject<StorageRef, AudioStorageURI> {
  return ValueObject(
    { bucket, internal_id, type },
    _idempotency_key,
    AudioStorageURI,
  )
}

const converter: MongoConverter<Audio> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { status, duration, filename, url, mime_type, metadata, storage },
  }) => ({
    id,
    data: {
      status,
      duration,
      filename,
      url,
      mime_type,
      metadata: metadata.props,
      storage: storage.props,
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
      status,
      filename,
      url,
      duration,
      mime_type,
      metadata,
      storage,
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createAudio(
      {
        status,
        duration,
        filename,
        url,
        mime_type,
        metadata,
        storage,
      },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface AudioRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const AudioRepository = ({
  client,
  entityContext,
}: AudioRepositoryConfig) =>
  MongoRepository<Audio>({
    ...{
      uri: process.env.MONGODB_AUDIO_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_AUDIO_DATABASE || 'db',
      collection: process.env.MONGODB_AUDIO_COLLECTION || 'audios',
    },
    client: client as any,
    converter,
    tag: AudioURI,
    entityContext,
  })
