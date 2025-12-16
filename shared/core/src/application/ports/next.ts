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
