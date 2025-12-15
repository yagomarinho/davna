import { isObject } from '@davna/utils'

import { Auditable } from './audited'
import { Identifiable } from './identifiable'
import { Resource } from './resource'
import { Tag } from './tag'
import { Version, Versioned } from './versioned'
import { UID } from '../kernel/uid'
import { Timestamp } from '../kernel/timestamp'

export const EntityURI = 'entity'
export type EntityURI = typeof EntityURI

export interface EntityMeta
  extends Resource<EntityURI>, Identifiable, Auditable {}

export interface Entity<
  P extends {} = {},
  T extends string = string,
  V extends Version = Version,
>
  extends Tag<T>, Versioned<V> {
  readonly meta: EntityMeta
  readonly props: Readonly<P>
}

export type DraftEntity<E extends Entity> = Omit<E, 'meta'> & {
  meta?: E['meta']
}

interface Context {
  uid: UID
  timestamp: Timestamp
}

export interface EntityContext {
  meta: () => EntityMeta
  isValid: (entity: unknown) => entity is Entity
}

export function EntityContext(ctx: Context): EntityContext {
  return {
    meta: () => createMeta(ctx),
    isValid: isValidEntity(ctx),
  }
}

EntityContext.createMeta = createMeta
EntityContext.isEntity = isEntity

export function createMeta({ uid, timestamp }: Context): EntityMeta {
  return {
    id: uid.generate(),
    _r: EntityURI,
    created_at: timestamp.now(),
    updated_at: timestamp.now(),
  }
}

export function isEntity(entity: unknown): entity is Entity {
  return (
    isObject(entity) &&
    isObject((entity as any).meta) &&
    (entity as any).meta._r === EntityURI
  )
}

export function isValidEntity(ctx: Pick<Context, 'uid'>) {
  return (entity: unknown): entity is Entity =>
    isEntity(entity) && ctx.uid.validate((entity as any).meta.id)
}
