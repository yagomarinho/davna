/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from '@davna/types'
import { applyEntry } from '@davna/utils'

import { OperationResult } from '../contracts'
import { Request } from './request'
import { Response } from './response'
import { Resource } from '../../domain'

/**
 * Resource identifier for handlers.
 *
 * Used to discriminate handler functions from other
 * executable domain constructs at runtime.
 */

export const HandlerURI = 'handler'
export type HandlerURI = typeof HandlerURI

/**
 * Represents the result of a handler execution.
 *
 * A handler produces a context-aware operation result
 * that ultimately resolves to a Response.
 */

export type HandlerResult<E> = OperationResult<E, Response>

/**
 * Internal handler function signature.
 *
 * - Env: environment required to handle the request
 * - Data: request payload
 * - Meta: request metadata
 *
 * The handler receives a Request and returns a HandlerResult,
 * allowing synchronous or asynchronous execution.
 */
interface HandlerFn<Env = {}, Data = any, Meta extends Metadata = any> {
  (request: Request<Data, Meta>): HandlerResult<Env>
}

/**
 * Public Handler contract.
 *
 * Represents an application or interface-layer entry point
 * responsible for handling incoming requests and producing
 * responses.
 *
 * Handlers are callable and carry a resource discriminator
 * for runtime identification.
 */
export interface Handler<E = any, D = any, M extends Metadata = any>
  extends HandlerFn<E, D, M>, Resource<HandlerURI> {}

/**
 * Handler factory function.
 *
 * Wraps a handler function and attaches the handler
 * resource identifier, ensuring consistent runtime shape.
 */
export function Handler<Env = {}, Data = any, Meta extends Metadata = any>(
  handler: HandlerFn<Env, Data, Meta>,
): Handler<Env, Data, Meta> {
  return applyEntry('_r', HandlerURI)(handler)
}

/**
 * Runtime type guard for handlers.
 *
 * Validates that a given value represents a handler
 * by checking its callable nature and resource identifier.
 */

export const isHandler = (handler: unknown): handler is Handler =>
  (typeof handler === 'function' || typeof handler === 'object') &&
  (handler as any)._r === HandlerURI
