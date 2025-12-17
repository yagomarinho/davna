/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Mapping from entity URIs to concrete entity types.
 *
 * Extend this interface to associate string identifiers
 * with actual entity implementations in the domain.
 */

export interface EntityURItoKind {}

/**
 * Type representing all valid entity URIs.
 *
 * Extracted as the keys of EntityURItoKind.
 */

export type EntityURIS = keyof EntityURItoKind

/**
 * Resolves a concrete entity type from a URI.
 *
 * Given a URI, returns the corresponding entity type
 * defined in EntityURItoKind.
 */

export type EntityOf<URI extends EntityURIS> = EntityURItoKind[URI]
