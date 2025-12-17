/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isObject } from '@davna/kernel'
import { Resource, Tag, verifyResource } from '../composition'

/**
 * Resource identifier for value objects.
 *
 * Used to discriminate value objects from other domain constructs
 * at runtime.
 */
export const ValueObjectURI = 'value-object'
export type ValueObjectURI = typeof ValueObjectURI

/**
 * Metadata associated with a value object.
 *
 * Value objects do not carry identity or lifecycle information,
 * only a resource discriminator.
 */

export interface ValueObjectMeta extends Resource<ValueObjectURI> {}

/**
 * Core Value Object contract.
 *
 * - P: immutable value properties
 * - T: semantic tag for specialization
 *
 * Value objects are defined by their values, not by identity.
 * They must be treated as immutable and freely replaceable.
 */
export interface ValueObject<
  P extends {} = {},
  T extends string = string,
> extends Tag<T> {
  meta: ValueObjectMeta
  props: Readonly<P>
}

/**
 * Creates metadata for a value object.
 *
 * Value object metadata is minimal by design and exists
 * solely to provide a resource discriminator.
 */

function createValueObjectMeta(): ValueObjectMeta {
  return {
    _r: ValueObjectURI,
  }
}

/**
 * Factory function for creating value objects.
 *
 * Ensures consistent structure, tagging, and metadata
 * initialization.
 */

export function ValueObject<P extends {}, T extends string>(
  props: P,
  tag: T,
): ValueObject<P, T> {
  return {
    _t: tag,
    props,
    meta: createValueObjectMeta(),
  }
}

/*
 * Static helper for runtime value object detection.
 */
ValueObject.isValueObject = isValueObject

/**
 * Structural value object check.
 *
 * Validates shape and resource identity,
 * without performing deep property validation.
 */

export function isValueObject(
  valueObject: unknown,
): valueObject is ValueObject {
  return (
    isObject(valueObject) &&
    isObject((valueObject as any).meta) &&
    verifyResource(ValueObjectURI)((valueObject as any).meta)
  )
}
