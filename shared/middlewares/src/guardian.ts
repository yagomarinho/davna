/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Either,
  isLeft,
  Left,
  Middleware,
  Next,
  Request,
  Response,
} from '@davna/core'

interface FailedResult {
  errors: string[]
}

export type GuardianResult = Either<FailedResult, Request>

export interface Validate {
  (request: Request): GuardianResult | Promise<GuardianResult>
}

interface Env {
  validate: Validate
  onLeft?: (
    left: Left<any>,
    originalRequest: Request,
  ) => Response | Promise<Response>
}

export const guardian = Middleware(
  request =>
    async (env: Env): Promise<any> => {
      const onLeft = env.onLeft ?? defaultGuardianResponse

      const validation = await env.validate(request)

      return isLeft(validation)
        ? onLeft(validation, request)
        : Next({ request: validation.value })
    },
)

function defaultGuardianResponse(left: Left<any>): Response {
  return Response({
    data: left.value,
    metadata: { headers: { status: 400 } },
  })
}
