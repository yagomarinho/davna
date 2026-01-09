/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HttpMethod } from './method'

export interface HttpRequest {
  method: HttpMethod
  path: string
  headers: Record<string, string>
  query: Record<string, string>
  params: Record<string, string>
  body: unknown
  bodyStream: ReadableStream
}
