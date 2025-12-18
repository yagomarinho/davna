/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isObject } from '@davna/kernel'
import {
  Buildable,
  Tag,
  verifyResource,
  Version,
  Versioned,
} from '../composition'
import { EntityURIS, EntityURItoKind } from '../types'
import { EntityMeta, EntityURI } from './meta'

/**
 * Core Entity interface.
 *
 * Represents a domain entity with:
 * - a unique tag (URI) for identification
 * - versioning for optimistic concurrency or tracking
 * - build capabilities to construct concrete instances
 *
 * - P: type of domain-specific properties
 * - T: entity URI used for type-level identification
 * - V: version type (default is string-based `Version`)
 */

export interface Entity<
  P extends {} = any,
  T extends EntityURIS = EntityURIS,
  V extends Version = Version,
>
  extends Tag<T>, Versioned<V>, Buildable<P, T> {
  readonly meta: EntityMeta
  readonly props: Readonly<P>
}

/**
 * Draft version of an entity.
 *
 * Used during creation or reconstruction phases
 * where metadata may not yet exist.
 */
export type DraftEntity<E extends Entity> = Omit<E, 'meta'> & {
  meta?: E['meta']
}

/**
 * Creates a new entity instance, either as a draft (without metadata)
 * or as a fully materialized entity (with metadata).
 *
 * - tag: the entity type identifier
 * - version: the version of the entity
 * - builder: the `_b` function used to rebuild the entity
 * - props: the entity properties
 * - meta (optional): the entity metadata; if not provided, the entity is a draft
 *
 * Returns a `DraftEntity` when metadata is not provided, or a fully typed entity otherwise.
 */

export function createEntity<T extends EntityURIS>(
  tag: T,
  version: EntityURItoKind[T]['_v'],
  builder: Buildable<EntityURItoKind[T]['props'], T>['_b'],
  props: EntityURItoKind[T]['props'],
): DraftEntity<EntityURItoKind[T]>

export function createEntity<T extends EntityURIS>(
  tag: T,
  version: EntityURItoKind[T]['_v'],
  builder: Buildable<EntityURItoKind[T]['props'], T>['_b'],
  props: EntityURItoKind[T]['props'],
  meta: EntityMeta,
): EntityURItoKind[T]

export function createEntity<T extends EntityURIS>(
  tag: T,
  version: EntityURItoKind[T]['_v'],
  builder: Buildable<EntityURItoKind[T]['props'], T>['_b'],
  props: EntityURItoKind[T]['props'],
  meta?: EntityMeta,
): any {
  return {
    _b: builder,
    _t: tag,
    _v: version,
    props,
    meta,
  }
}

/**
 * Structural entity check.
 *
 * Validates shape and resource identity,
 * but does NOT validate identifier semantics.
 */

export function isEntity<E extends Entity>(
  entity: DraftEntity<E>,
): entity is E {
  return (
    isObject(entity) &&
    isObject(entity.meta) &&
    verifyResource(EntityURI)(entity.meta)
  )
}
