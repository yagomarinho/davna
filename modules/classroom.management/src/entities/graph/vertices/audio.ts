import { applyTag, applyVersioning, Entity, Metadata } from '@davna/core'

export const AudioURI = 'audio'
export type AudioURI = typeof AudioURI

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
  storage: StorageRef
  metadata: Metadata
}

export interface Audio extends AudioProps, Entity<AudioURI, 'v1'> {}

export interface CreateAudio extends AudioProps, Partial<Entity> {}

export function Audio(
  id: string,
  filename: string,
  mime_type: string,
  url: string,
  duration: number,
  storage: StorageRef,
  metadata: Metadata,
  status: 'persistent' | 'presigned',
  created_at: Date,
  updated_at: Date,
): Audio {
  return applyVersioning('v1')(
    applyTag(AudioURI)({
      id,
      filename,
      mime_type,
      url,
      duration,
      storage,
      metadata,
      status,
      created_at,
      updated_at,
    }),
  )
}

Audio.create = function createAudio({
  id = '',
  filename,
  mime_type,
  url,
  duration,
  storage,
  metadata,
  status,
  created_at,
  updated_at,
}: CreateAudio): Audio {
  const now = new Date()
  return Audio(
    id,
    filename,
    mime_type,
    url,
    duration,
    storage,
    metadata,
    status,
    created_at ?? now,
    updated_at ?? now,
  )
}

Audio.persistent = function persistentAudio(
  props: Omit<CreateAudio, 'status'>,
): Audio {
  return Audio.create({
    ...props,
    status: 'persistent',
  })
}

Audio.presigned = function persistentAudio(
  props: Pick<CreateAudio, 'duration' | 'mime_type' | 'metadata'>,
): Audio {
  return Audio.create({
    ...props,
    status: 'presigned',
    filename: '',
    storage: {},
    url,
  })
}
