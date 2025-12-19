/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  createEntity,
  DraftEntity,
  Entity,
  EntityMeta,
  ValueObject,
} from '@davna/core'
import { Metadata } from '@davna/kernel'

export const AudioURI = 'audio'
export type AudioURI = typeof AudioURI

export const AudioVersion = 'v1'
export type AudioVersion = typeof AudioVersion

interface StorageRef {
  type: string
  internal_id: string
  bucket: string
  download_url: string
}

export interface AudioProps {
  status: 'presigned' | 'persistent'
  filename: string
  mime_type: string
  url: string
  duration: number // in secs
  storage: ValueObject<StorageRef>
  metadata: Metadata
}

export interface Audio extends Entity<AudioProps, AudioURI, AudioVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [AudioURI]: Audio
  }
}

export function createAudio(props: AudioProps): DraftEntity<Audio>
export function createAudio(
  props: AudioProps,
  meta: undefined,
  _version: AudioVersion,
): DraftEntity<Audio>
export function createAudio(
  props: AudioProps,
  meta: EntityMeta,
  _version?: AudioVersion,
): Audio
export function createAudio(
  { status, filename, mime_type, url, duration, storage, metadata }: AudioProps,
  meta?: EntityMeta,
  _version: AudioVersion = AudioVersion,
): DraftEntity<Audio> | Audio {
  return createEntity(
    AudioURI,
    _version,
    createAudio,
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
