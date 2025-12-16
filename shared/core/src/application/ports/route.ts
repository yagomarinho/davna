/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Handler } from './handler'

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface Route<E = any> {
  method: HTTPMethod
  path: `/${string}`
  handler: Handler<E>
  env: E
}

export type RouteInitWithoutEnv = {
  method?: HTTPMethod
  path: `/${string}`
  handler: Handler<{}>
}

export type RouteInit<E> = {
  method?: HTTPMethod
  path: `/${string}`
  handler: Handler<E>
  env: E
}

export function Route(route: RouteInitWithoutEnv): Route<{}>
export function Route<E>(route: RouteInit<E>): Route<E>
export function Route<E = {}>({
  method = 'get',
  path,
  handler,
  env = {} as E,
}: any): Route<E> {
  return { method, path, handler, env }
}
