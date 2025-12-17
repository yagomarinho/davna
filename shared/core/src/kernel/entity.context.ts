/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isObject } from '@davna/utils'

import { Timestamp } from './timestamp'
import { UID } from './uid'

import { Entity, EntityMeta, EntityURI, verifyResource } from '../domain'
import { Resolvable } from '../application'

/**
 * Runtime services required to create and validate entity metadata.
 */
export interface EntityContextProps {
  uid: UID
  timestamp: Timestamp
}

/**
 * Entity context facade.
 *
 * Exposes controlled operations related to entity lifecycle:
 * - metadata creation
 * - structural and identity validation
 */

export interface EntityContext {
  meta: () => Resolvable<EntityMeta>
  isValid: (entity: unknown) => entity is Entity
}

/**
 * Creates a context-bound entity helper.
 *
 * The resulting functions are pure with respect
 * to the provided context.
 */

export function EntityContext(ctx: EntityContextProps): EntityContext {
  return {
    meta: () => createMeta(ctx),
    isValid: isValidEntity(ctx),
  }
}

/*
 * Static helpers exposed for advanced or internal use.
 */
EntityContext.createMeta = createMeta
EntityContext.isEntity = isEntity

/**
 * Creates a fresh entity metadata object.
 *
 * - Generates a unique identifier
 * - Assigns the entity resource URI
 * - Initializes audit timestamps
 */

export function createMeta({ uid, timestamp }: EntityContextProps): EntityMeta {
  return {
    id: uid.generate(),
    _r: EntityURI,
    created_at: timestamp.now(),
    updated_at: timestamp.now(),
  }
}

/**
 * Structural entity check.
 *
 * Validates shape and resource identity,
 * but does NOT validate identifier semantics.
 */

export function isEntity(entity: unknown): entity is Entity {
  return (
    isObject(entity) &&
    isObject((entity as any).meta) &&
    verifyResource(EntityURI)((entity as any).meta)
  )
}

/**
 * Context-aware entity validation.
 *
 * Ensures:
 * - the object is a valid entity
 * - the entity identifier is valid according to UID rules
 */

export function isValidEntity(ctx: Pick<EntityContextProps, 'uid'>) {
  return (entity: unknown): entity is Entity =>
    isEntity(entity) && ctx.uid.validate((entity as any).meta.id)
}
