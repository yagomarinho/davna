/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from './metadata'
import { Request } from './request'
import { Response } from './response'
import { Result } from './result'
import { applyTag, Tagged, verifyTag } from './tagged'

export type HandlerResult<E> = Result<E, Response>

interface H<E = {}, D = any, M extends Metadata = any> {
  (request: Request<D, M>): HandlerResult<E>
}

export interface Handler<E = any, D = any, M extends Metadata = any>
  extends H<E, D, M>, Tagged<'handler'> {}

export function Handler<E = {}, D = any, M extends Metadata = any>(
  handler: H<E, D, M>,
): Handler<E, D, M> {
  const taggedHandler = applyTag('handler')(handler)

  return taggedHandler
}

export const isHandler = (handler: unknown): handler is Handler =>
  verifyTag('handler')(handler)
