import { Metadata } from './metadata'
import { Request } from './request'
import { Result } from './result'
import { applyTag, Tagged, verifyTag } from './tagged'

export interface NextProps<D = any, M extends Metadata = any> {
  readonly request: Request<D, M>
}

export interface Next<D = any, M extends Metadata = any>
  extends NextProps<D, M>,
    Tagged<'next'> {}

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
