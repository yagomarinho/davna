/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isObject } from '@davna/utils'
import { Resource } from './resource'
import { Tag } from './tag'

export const ValueObjectURI = 'value-object'
export type ValueObjectURI = typeof ValueObjectURI

export interface ValueObjectMeta extends Resource<ValueObjectURI> {}

export interface ValueObject<
  P extends {} = {},
  T extends string = string,
> extends Tag<T> {
  meta: ValueObjectMeta
  props: Readonly<P>
}

export function ValueObject<P extends {}, T extends string>(
  props: P,
  tag: T,
): ValueObject<P, T> {
  return {
    _t: tag,
    props,
    meta: {
      _r: ValueObjectURI,
    },
  }
}

ValueObject.isValueObject = isValueObject

export function isValueObject(
  valueObject: unknown,
): valueObject is ValueObject {
  return (
    isObject(valueObject) &&
    isObject((valueObject as any).meta) &&
    (valueObject as any).meta._r === ValueObjectURI
  )
}
