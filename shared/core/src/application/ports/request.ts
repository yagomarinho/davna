/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from '@davna/types'
import { Resource, verifyResource } from '../../domain'

/**
 * Resource identifier for requests.
 *
 * Used to discriminate request objects from other
 * domain constructs at runtime.
 */

export const RequestURI = 'request'
export type RequestURI = typeof RequestURI

/**
 * Core properties of a request.
 *
 * - D: payload data carried by the request
 * - M: metadata associated with the request
 */

export interface RequestProps<D = any, M extends Metadata = any> {
  data: D
  metadata: M
}

/**
 * Request contract.
 *
 * Combines request properties with a resource discriminator
 * to allow safe runtime identification.
 */

export interface Request<D = any, M extends Metadata = any>
  extends RequestProps<D, M>, Resource<RequestURI> {}

/**
 * Request factory function.
 *
 * Creates a new Request instance from data and metadata,
 * attaching the request resource identifier.
 */

export function Request<D, M extends Metadata>({
  data,
  metadata,
}: RequestProps<D, M>): Request<D, M> {
  return {
    _r: RequestURI,
    data,
    metadata,
  }
}

/**
 * Helper for updating or creating request data.
 *
 * Supports:
 * - creating an empty request
 * - setting data on a new request
 * - replacing data on an existing request
 */

function data(): Request
function data<D>(data: D): Request<D>
function data<D, M extends Metadata>(
  data: D,
  request: Request<D, M>,
): Request<D, M>
function data(data?: any, request?: Request): Request {
  return Request({ data, metadata: request?.metadata })
}

/**
 * Helper for updating or creating request metadata.
 *
 * Supports:
 * - creating an empty request
 * - setting metadata on a new request
 * - replacing metadata on an existing request
 */

function metadata(): Request
function metadata<M extends Metadata>(metadata: M): Request<any, M>
function metadata<M extends Metadata, D>(
  metadata: M,
  request: Request<D, any>,
): Request<D, M>
function metadata(metadata?: any, request?: Request): Request {
  return Request({ data: request?.data, metadata })
}

/*
 * Namespace-style helpers attached to the Request factory.
 *
 * Enables functional-style composition of request data
 * and metadata.
 */

Request.data = data
Request.metadata = metadata

/**
 * Runtime type guard for requests.
 *
 * Validates that a given value represents a request
 * by checking its resource identifier.
 */

export const isRequest = (request: unknown): request is Request =>
  verifyResource(RequestURI)(request)
