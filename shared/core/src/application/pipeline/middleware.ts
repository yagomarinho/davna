/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata, applyEntry } from '@davna/kernel'

import { HandlerResult, NextResult, Request } from '../ports'
import { Resource, verifyResource } from '../../domain'

/**
 * Resource identifier for middleware.
 *
 * Used to discriminate middleware functions from other
 * handler-like constructs at runtime.
 */

export const MiddlewareURI = 'middleware'
export type MiddlewareURI = typeof MiddlewareURI

/**
 * Result type produced by a middleware execution.
 *
 * A middleware may:
 * - produce a final handler result (terminating the pipeline)
 * - return a Next signal to continue processing
 *
 * Both outcomes may be synchronous or asynchronous
 * and environment-dependent.
 */

export type MiddlewareResult<Env, Data = any, Meta extends Metadata = any> =
  | HandlerResult<Env>
  | NextResult<Env, Data, Meta>

/**
 * Middleware function signature.
 *
 * Receives a request and decides whether to:
 * - handle it directly
 * - forward it to the next middleware or handler
 */

interface MiddlewareFn<Env = {}, Data = any, Meta extends Metadata = any> {
  (request: Request<Data, Meta>): MiddlewareResult<Env, Data, Meta>
}

/**
 * Middleware contract.
 *
 * Combines the middleware function signature with a
 * resource discriminator to allow runtime identification.
 */
export interface Middleware<Env = {}, Data = any, Meta extends Metadata = any>
  extends MiddlewareFn<Env, Data, Meta>, Resource<MiddlewareURI> {}

/**
 * Middleware factory function.
 *
 * Wraps a middleware function and marks it as a middleware
 * resource by attaching the middleware identifier.
 */

export function Middleware<Env = {}, Data = any, Meta extends Metadata = any>(
  middleware: MiddlewareFn<Env, Data, Meta>,
): Middleware<Env, Data, Meta> {
  return applyEntry('_r', MiddlewareURI)(middleware)
}

/**
 * Runtime type guard for middleware.
 *
 * Validates that a given value represents a middleware
 * by checking its resource identifier.
 */

export const isMiddleware = (middleware: unknown): middleware is Middleware =>
  verifyResource(MiddlewareURI)(middleware)
