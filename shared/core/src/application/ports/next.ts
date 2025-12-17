/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from '@davna/kernel'
import { Request } from './request'

import { OperationResult } from '../contracts'
import { Resource, verifyResource } from '../../domain'

/**
 * Resource identifier for the "next" control flow object.
 *
 * Used to signal that request processing should continue
 * to the next handler in the pipeline.
 */

export const NextURI = 'next'
export type NextURI = typeof NextURI

/**
 * Core properties of a Next object.
 *
 * Encapsulates the current request that should be forwarded
 * to the next processing step.
 */

export interface NextProps<D = any, M extends Metadata = any> {
  readonly request: Request<D, M>
}

/**
 * Next contract.
 *
 * Represents an explicit continuation signal in a handler
 * or middleware pipeline, carrying the current request.
 */

export interface Next<D = any, M extends Metadata = any>
  extends NextProps<D, M>, Resource<NextURI> {}

/**
 * Result type for operations that may yield a Next signal.
 *
 * Allows Next to be returned synchronously or asynchronously
 * while remaining environment-aware.
 */

export type NextResult<
  Env,
  Data = any,
  Meta extends Metadata = any,
> = OperationResult<Env, Next<Data, Meta>>

/**
 * Next factory function.
 *
 * Creates a Next object that wraps the given request and
 * marks it with the Next resource identifier.
 */

export function Next<Data, Meta extends Metadata>({
  request,
}: NextProps<Data, Meta>): Next<Data, Meta> {
  return { _r: NextURI, request }
}

/**
 * Runtime type guard for Next.
 *
 * Validates that a value represents a Next continuation
 * by checking its resource identifier.
 */

export const isNext = (value: unknown): value is Next =>
  verifyResource(NextURI)(value)
