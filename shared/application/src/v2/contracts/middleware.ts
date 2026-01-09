/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resolvable, Tag } from '@davna/core'
import { ExecutionContext } from './execution.context'
import { Failure } from './result'

export const NextURI = 'next'
export type NextURI = typeof NextURI

export interface Next<Data = any> extends Tag<NextURI> {
  data: Data
  ctx: ExecutionContext
}

export type MiddlewareResult<Error, Data> = Failure<Error> | Next<Data>

export function Next<Data>(data: Data, ctx: ExecutionContext): Next<Data> {
  return {
    _t: NextURI,
    data,
    ctx,
  }
}

export interface Middleware<Input = any, Output = any, Env = any, Error = any> {
  (
    data: Input,
    env: Env,
    ctx: ExecutionContext,
  ): Resolvable<MiddlewareResult<Error, Output>>
}
