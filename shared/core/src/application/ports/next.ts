/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from '@davna/types'
import { Request } from './request'

export interface NextProps<D = any, M extends Metadata = any> {
  readonly request: Request<D, M>
}

export interface Next<D = any, M extends Metadata = any>
  extends NextProps<D, M>, Tag<'next'> {}

export type NextResult<E, D = any, M extends Metadata = any> = Result<
  E,
  Next<D, M>
>

export function Next<D, M extends Metadata>({
  request,
}: NextProps<D, M>): Next<D, M> {
  return applyTag('next')({ request })
}

export const isNext = (value: unknown): value is Next =>
  verifyTag('next')(value)
