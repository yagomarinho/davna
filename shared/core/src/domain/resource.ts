/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isObject } from '@davna/utils'

/**
 * Represents a typed resource discriminator.
 *
 * Used to explicitly identify the resource type at runtime,
 * enabling safe differentiation between domain structures.
 */

export interface Resource<U extends string> {
  readonly _r: U
}

/**
 * Creates a resource type guard for a specific resource type.
 *
 * Returns a function that verifies whether a given value
 * represents a resource with the expected resource identifier.
 *
 * This utility enables safe runtime discrimination of
 * domain constructs based on their resource type.
 */

export function verifyResource<T extends string>(resource_type: T) {
  return (resource: unknown): resource is Resource<T> =>
    (isObject(resource) || typeof resource === 'function') &&
    (resource as any)._r === resource_type
}
