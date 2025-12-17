/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '../../../../domain'

/**
 * Extracts the entity tag (URI) from an Entity type.
 *
 * Given an Entity, this type resolves to its T parameter
 * (the entity URI). If the type does not match, defaults to string.
 *
 * Useful for type-level operations that depend on
 * identifying the kind of entity.
 */

export type ExtractEntityTag<E extends Entity> =
  E extends Entity<any, infer T> ? T : string
