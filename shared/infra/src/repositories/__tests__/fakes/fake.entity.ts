import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

export interface EnProps {
  name: string
  value: number
}

export const EnURI = 'En'
export type EnURI = typeof EnURI

export const EnVersion = 'v1'
export type EnVersion = typeof EnVersion

export interface En extends Entity<EnProps, EnURI, EnVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [EnURI]: En
  }
}

export function En({ name, value }: EnProps): DraftEntity<En>
export function En({ name, value }: EnProps, meta: EntityMeta): En
export function En({ name, value }: EnProps, meta?: EntityMeta): En {
  return createEntity(EnURI, EnVersion, En, { name, value }, meta as any)
}
