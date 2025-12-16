/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from './metadata'
import { applyTag, Tagged, verifyTag } from './tagged'

const URI = 'response'
type URI = typeof URI

export interface ResponseProps<D = any, M extends Metadata = any> {
  data: D
  metadata: M
}

export interface Response<B = any, M extends Metadata = any>
  extends ResponseProps<B, M>,
    Tagged<'response'> {}

export function Response<D, M extends Metadata>({
  data,
  metadata,
}: ResponseProps<D, M>): Response<D, M> {
  return applyTag(URI)({
    data,
    metadata,
  })
}

function data(): Response
function data<D>(data: D): Response<D>
function data<D, M extends Metadata>(
  data: D,
  response: Response<D, M>,
): Response<D, M>
function data(data?: any, response?: Response): Response {
  return Response({ data, metadata: response?.metadata })
}

function metadata(): Response
function metadata<M extends Metadata>(metadata: M): Response<any, M>
function metadata<M extends Metadata, D>(
  metadata: M,
  response: Response<D, any>,
): Response<D, M>
function metadata(metadata?: any, response?: Response): Response {
  return Response({ data: response?.data, metadata })
}

Response.data = data
Response.metadata = metadata

export const isResponse = (value: unknown): value is Response =>
  verifyTag('response')(value)
