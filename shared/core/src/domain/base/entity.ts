/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Buildable, Tag, Version, Versioned } from '../composition'
import { EntityURIS } from '../types'
import { EntityMeta } from './meta'

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
  P extends {} = {},
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
