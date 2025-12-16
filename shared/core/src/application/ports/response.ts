/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from '@davna/types'
import { Resource, verifyResource } from '../../domain'

/**
 * Resource identifier for responses.
 *
 * Used to discriminate response objects from other
 * domain resources at runtime.
 */

export const ResponseURI = 'response'
export type ResponseURI = typeof ResponseURI

/**
 * Core properties of a response.
 *
 * - D: response payload
 * - M: response metadata (headers, status, tracing, etc.)
 */

export interface ResponseProps<D = any, M extends Metadata = any> {
  data: D
  metadata: M
}

/**
 * Response contract.
 *
 * Combines response properties with a resource discriminator
 * to allow safe runtime identification and composition.
 */

export interface Response<B = any, M extends Metadata = any>
  extends ResponseProps<B, M>, Resource<ResponseURI> {}

/**
 * Response factory function.
 *
 * Creates a new Response instance from data and metadata,
 * attaching the response resource identifier.
 */

export function Response<D, M extends Metadata>({
  data,
  metadata,
}: ResponseProps<D, M>): Response<D, M> {
  return {
    _r: ResponseURI,
    data,
    metadata,
  }
}

/**
 * Helper for creating or updating response data.
 *
 * Supports:
 * - creating an empty response
 * - setting data on a new response
 * - replacing data on an existing response
 */

function data(): Response
function data<D>(data: D): Response<D>
function data<D, M extends Metadata>(
  data: D,
  response: Response<D, M>,
): Response<D, M>
function data(data?: any, response?: Response): Response {
  return Response({ data, metadata: response?.metadata })
}

/**
 * Helper for creating or updating response metadata.
 *
 * Supports:
 * - creating an empty response
 * - setting metadata on a new response
 * - replacing metadata on an existing response
 */

function metadata(): Response
function metadata<M extends Metadata>(metadata: M): Response<any, M>
function metadata<M extends Metadata, D>(
  metadata: M,
  response: Response<D, any>,
): Response<D, M>
function metadata(metadata?: any, response?: Response): Response {
  return Response({ data: response?.data, metadata })
}

/*
 * Namespace-style helpers attached to the Response factory.
 *
 * Enables functional-style manipulation of response
 * data and metadata.
 */

Response.data = data
Response.metadata = metadata

/**
 * Runtime type guard for responses.
 *
 * Validates that a given value represents a response
 * by checking its resource identifier.
 */

export const isResponse = (value: unknown): value is Response =>
  verifyResource(ResponseURI)(value)
