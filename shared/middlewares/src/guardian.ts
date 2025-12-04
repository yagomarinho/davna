import {
  Either,
  isLeft,
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
}

export const guardian = Middleware(
  request =>
    async (env: Env): Promise<any> => {
      const validation = await env.validate(request)

      return isLeft(validation)
        ? Response({
            data: validation.value,
            metadata: { headers: { status: 400 } },
          })
        : Next({ request: validation.value })
    },
)
