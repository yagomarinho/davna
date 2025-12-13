import { Entity, Metadata } from '@davna/core'

export const TextURI = 'text'
export type TextURI = typeof TextURI

export interface Text extends Entity<TextURI> {
  content: string
  metadata: Metadata
}
