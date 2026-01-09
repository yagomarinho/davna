/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Tag } from '@davna/core'

export const FailureURI = 'failure'
export type FailureURI = typeof FailureURI

export const SuccessfulURI = 'successful'
export type SuccessfulURI = typeof SuccessfulURI

export interface Failure<E = any> extends Tag<FailureURI> {
  error: E
}

export interface Successful<D = any> extends Tag<SuccessfulURI> {
  data: D
}

export type Result<E = any, D = any> = Failure<E> | Successful<D>

export function Result<E>(type: FailureURI, error: E): Failure<E>
export function Result<D>(type: SuccessfulURI, data: D): Successful<D>
export function Result(type: FailureURI | SuccessfulURI, data: any): Result {
  return type === FailureURI ? Failure(data) : Successful(data)
}

Result.throw = <E>(error: E) => Failure(error)
Result.done = <D>(data: D) => Successful(data)

export function Failure<E>(error: E): Failure<E> {
  return {
    _t: FailureURI,
    error,
  }
}

export function Successful<D>(data: D): Successful<D> {
  return {
    _t: SuccessfulURI,
    data,
  }
}

export function isFailure(result: Result): result is Failure {
  return result._t === FailureURI
}

export function isSuccessful(result: Result): result is Successful {
  return result._t === SuccessfulURI
}
