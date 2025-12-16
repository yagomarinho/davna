/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HandlerResult } from './handler'
import { Metadata } from './metadata'
import { Response } from './response'
import { applyTag, Tagged, verifyTag } from './tagged'

export type PostResult<E> = HandlerResult<E>

interface P<E, D, M extends Metadata> {
  (response: Response<D, M>): PostResult<E>
}

export interface Postprocessor<E = {}, D = any, M extends Metadata = any>
  extends P<E, D, M>, Tagged<'postprocessor'> {}

export function Postprocessor<E = {}, D = any, M extends Metadata = any>(
  processor: P<E, D, M>,
): Postprocessor<E, D, M> {
  return applyTag('postprocessor')(processor)
}

export const isPostprocessor = (
  processor: unknown,
): processor is Postprocessor => verifyTag('postprocessor')(processor)
