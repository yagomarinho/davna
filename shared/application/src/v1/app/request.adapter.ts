/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Request as ExpressRequest } from 'express'
import { Request } from '@davna/core'

interface ExtendedRequest extends ExpressRequest {
  ctx?: any
}

export function requestAdapter(request: ExtendedRequest): Request {
  return Request({
    data: request.body,
    metadata: {
      ...(request.ctx ?? {}),
      headers: request.headers,
      params: request.params,
      query: request.query,
    },
  })
}
