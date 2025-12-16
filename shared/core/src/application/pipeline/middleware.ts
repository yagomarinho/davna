/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from '@davna/types'
import { HandlerResult } from '../ports/handler'
import { NextResult } from '../ports/next'

export type MiddlewareResult<E, D = any, M extends Metadata = any> =
  | HandlerResult<E>
  | NextResult<E, D, M>

interface M<E = {}, D = any, U extends Metadata = any> {
  (request: Request<D, U>): MiddlewareResult<E, D, U>
}

export interface Middleware<E = {}, D = any, U extends Metadata = any>
  extends M<E, D, U>, Tagged<'middleware'> {}

export function Middleware<E = {}, D = any, U extends Metadata = any>(
  middleware: M<E, D, U>,
): Middleware<E, D, U> {
  return applyTag('middleware')(middleware)
}

export const isMiddleware = (middleware: unknown): middleware is Middleware =>
  verifyTag('middleware')(middleware)
