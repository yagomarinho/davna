import { Response as ExpressResponse, RequestHandler } from 'express'
import { Handler } from '../core/handler'
import { requestAdapter } from './request.adapter'
import { Response } from '../core/response'

export function expressHandlerAdapter(handler: Handler<{}>): RequestHandler
export function expressHandlerAdapter<E>(
  handler: Handler<E>,
  env: E,
): RequestHandler
export function expressHandlerAdapter<E = {}>(
  handler: Handler<any>,
  env: E = {} as E,
): RequestHandler {
  return (request, response) => {
    try {
      const res = handler(requestAdapter(request))(env)

      if (res instanceof Promise) {
        return res.then(responseAdapter(response)).catch(handleError(response))
      }
      return responseAdapter(response)(res)
    } catch (e) {
      handleError(response)(e)
    }
  }
}

function responseAdapter(response: ExpressResponse) {
  return (res: Response) => {
    const headers = res.metadata?.headers ?? {}

    if (headers['Content-Type']?.startsWith('audio/')) {
      const buffer = res.data

      const h = new Headers(Object.entries(headers))

      response.setHeaders(h)
      return response.send(buffer)
    }

    const status = headers.status ?? 200
    const data = res.data ?? {}

    return response.status(status).json(data)
  }
}

function handleError(response: ExpressResponse) {
  return (err: any) => {
    // eslint-disable-next-line no-console
    console.error(err)
    return response.status(500).json({ message: 'Internal server error!' })
  }
}
