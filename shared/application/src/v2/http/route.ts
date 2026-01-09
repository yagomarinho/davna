/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface HttpRoute {
  method: HttpMethod
  path: string
  handler: Handler<HandlerInput, HandlerOutput, Env>
  guardian: Guardian<GuardianOutput, Env>
  middleware: M
  postprocessor: P
  onError: ErrorHandler<Env, Error>
  env: (globalEnv: any) => Env
}

export function HttpRoute({
  method,
  path,
  handler,
  guardian,
  middleware,
  postprocessor,
  onError,
  env,
}) {
  return {
    method,
    path,
    handler,
    guardian,
    middleware,
    postprocessor,
    onError,
    env,
  }
}
