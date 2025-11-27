import { HandlerResult } from './handler'
import { Metadata } from './metadata'
import { NextResult } from './next'
import { Request } from './request'
import { applyTag, Tagged, verifyTag } from './tagged'

export type MiddlewareResult<E, D = any, M extends Metadata = any> =
  | HandlerResult<E>
  | NextResult<E, D, M>

interface M<E = {}, D = any, U extends Metadata = any> {
  (request: Request<D, U>): MiddlewareResult<E, D, U>
}

export interface Middleware<E = {}, D = any, U extends Metadata = any>
  extends M<E, D, U>,
    Tagged<'middleware'> {}

export function Middleware<E = {}, D = any, U extends Metadata = any>(
  middleware: M<E, D, U>,
): Middleware<E, D, U> {
  return applyTag('middleware')(middleware)
}

export const isMiddleware = (
  middleware: unknown,
): middleware is Middleware<any> => verifyTag('middleware')(middleware)
