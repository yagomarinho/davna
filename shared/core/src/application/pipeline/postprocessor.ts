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

/**
 * Resource identifier for postprocessors.
 *
 * Used to discriminate postprocessor functions from other
 * response-related processors at runtime.
 */

export const PostprocessorURI = 'postprocessor'
export type PostprocessorURI = typeof PostprocessorURI

/**
 * Result type produced by a postprocessor.
 *
 * A postprocessor always yields a handler result,
 * allowing it to finalize, transform, or side-effect
 * a response after main handling.
 */

export type ProcessorResult<E> = HandlerResult<E>

/**
 * Core postprocessor function signature.
 *
 * Receives a Response and produces a handler result,
 * potentially using an external environment.
 */

interface Processor<Env, Data, Meta extends Metadata> {
  (response: Response<Data, Meta>): ProcessorResult<Env>
}

/**
 * Postprocessor contract.
 *
 * Represents a processing step that runs after a handler
 * has produced a response, enabling transformations,
 * logging, metrics, or other cross-cutting concerns.
 */

export interface Postprocessor<
  Env = {},
  Data = any,
  Meta extends Metadata = any,
>
  extends Processor<Env, Data, Meta>, Resource<PostprocessorURI> {}

/**
 * Postprocessor factory function.
 *
 * Wraps a processor function and marks it as a postprocessor
 * resource by attaching the postprocessor identifier.
 */

export function Postprocessor<
  Env = {},
  Data = any,
  Meta extends Metadata = any,
>(processor: Processor<Env, Data, Meta>): Postprocessor<Env, Data, Meta> {
  return applyEntry('_r', PostprocessorURI)(processor)
}

/**
 * Runtime type guard for postprocessors.
 *
 * Validates that a given value represents a postprocessor
 * by checking its resource identifier.
 */

export const isPostprocessor = (
  processor: unknown,
): processor is Postprocessor => verifyResource(PostprocessorURI)(processor)
