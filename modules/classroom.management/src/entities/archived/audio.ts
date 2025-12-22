/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { STORAGE_TYPE } from '@davna/infra'

const URI = 'audio'
type URI = typeof URI

interface Ref {
  storage: STORAGE_TYPE
  identifier: string
}

export interface UploadedAudioProps {
  src: string
  internal_ref: Ref
}

export interface AudioProps {
  owner_id: string
  name: string
  mime: SUPORTED_MIME_TYPE
  duration: number
}

export interface Audio
  extends AudioProps, UploadedAudioProps, Entity<URI, 'v1'> {}

export interface CreateAudio
  extends AudioProps, Partial<UploadedAudioProps>, Partial<Entity> {}

export function Audio(
  id: string,
  owner_id: string,
  name: string,
  mime: SUPORTED_MIME_TYPE,
  src: string,
  duration: number,
  internal_ref: Ref,
  created_at: Date,
  updated_at: Date,
): Audio {
  return applyVersioning('v1')(
    applyTag('audio')({
      id,
      owner_id,
      name,
      mime,
      src,
      internal_ref,
      duration,
      created_at,
      updated_at,
    }),
  )
}

Audio.create = ({
  id = '',
  owner_id,
  name,
  mime,
  src = '',
  duration,
  internal_ref = {} as any,
  created_at,
  updated_at,
}: CreateAudio) => {
  const now = new Date()
  return Audio(
    id,
    owner_id,
    name,
    mime,
    src,
    duration,
    internal_ref,
    created_at ?? now,
    updated_at ?? now,
  )
}
