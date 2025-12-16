/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Either } from './either'
import { Result } from './result'
import { applyTag, Tagged, verifyTag } from './tagged'

interface FailedResult {
  message: string
  data?: any
}

type ServiceResult<E, A> = Result<E, Either<FailedResult, A>>

interface S<D, E, A> {
  (data: D): ServiceResult<E, A>
}

export type Service<D = void, E = {}, A = void> = D extends void
  ? (() => ServiceResult<E, A>) & Tagged<'service'>
  : ((data: D) => ServiceResult<E, A>) & Tagged<'service'>

export function Service<D = void, E = {}, A = void>(
  service: S<D, E, A>,
): Service<D, E, A> {
  const taggedService = applyTag('service')(service)

  return taggedService as any
}

export const isService = (service: unknown): service is Service =>
  verifyTag('service')(service)
