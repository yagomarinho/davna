import { Metadata } from './metadata'
import { applyTag, Tagged, verifyTag } from './tagged'

export type Context = Record<string, any>

export interface RequestProps<D = any, M extends Metadata = any> {
  data: D
  metadata: M
}

export interface Request<D = any, M extends Metadata = any>
  extends RequestProps<D, M>,
    Tagged<'request'> {}

export function Request<D, M extends Metadata>({
  data,
  metadata,
}: RequestProps<D, M>): Request<D, M> {
  return applyTag('request')({
    data,
    metadata,
  })
}

function data(): Request
function data<D>(data: D): Request<D>
function data<D, M extends Metadata>(
  data: D,
  request: Request<D, M>,
): Request<D, M>
function data(data?: any, request?: Request): Request {
  return Request({ data, metadata: request?.metadata })
}

function metadata(): Request
function metadata<M extends Metadata>(metadata: M): Request<any, M>
function metadata<M extends Metadata, D>(
  metadata: M,
  request: Request<D, any>,
): Request<D, M>
function metadata(metadata?: any, request?: Request): Request {
  return Request({ data: request?.data, metadata })
}

Request.data = data
Request.metadata = metadata

export const isRequest = (value: unknown): value is Request =>
  verifyTag('request')(value)
