import { Entity, Metadata } from '@davna/core'

export const AudioURI = 'audio'
export type AudioURI = typeof AudioURI

interface StorageRef {
  type: string
  internal_id: string
  bucket: string
  download_url: string
}

export interface Audio extends Entity<AudioURI> {
  name: string
  mime: string
  url: string
  duration: string
  storage: StorageRef
  metadata: Metadata
}
