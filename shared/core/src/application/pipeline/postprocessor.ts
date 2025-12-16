/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from '@davna/types'
import { applyEntry } from '@davna/utils'

import { HandlerResult, Response } from '../ports'
import { Resource, verifyResource } from '../../domain'

export const PostprocessorURI = 'postprocessor'
export type PostprocessorURI = typeof PostprocessorURI

export type ProcessorResult<E> = HandlerResult<E>

interface Processor<Env, Data, Meta extends Metadata> {
  (response: Response<Data, Meta>): ProcessorResult<Env>
}

export interface Postprocessor<
  Env = {},
  Data = any,
  Meta extends Metadata = any,
>
  extends Processor<Env, Data, Meta>, Resource<PostprocessorURI> {}

export function Postprocessor<
  Env = {},
  Data = any,
  Meta extends Metadata = any,
>(processor: Processor<Env, Data, Meta>): Postprocessor<Env, Data, Meta> {
  return applyEntry('_r', PostprocessorURI)(processor)
}

export const isPostprocessor = (
  processor: unknown,
): processor is Postprocessor => verifyResource(PostprocessorURI)(processor)
