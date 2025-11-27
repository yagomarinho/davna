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
