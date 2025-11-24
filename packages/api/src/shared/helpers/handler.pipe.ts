/* eslint-disable no-console */
import { Handler, isHandler } from '../core/handler'
import { Middleware } from '../core/middleware'
import { isNext, Next } from '../core/next'
import { isRequest, Request } from '../core/request'
import { isResponse, Response } from '../core/response'

type ForwardResult =
  | Request<any>
  | Response<any>
  | Promise<Request<any>>
  | Promise<Response<any>>

export function handlerPipe<E>(
  ...pipe: [...Middleware<E>[], Handler<E>]
): Handler<E> {
  return Handler(request => env => {
    const resp = pipe.reduce((r, mh): ForwardResult => {
      if (r instanceof Promise) return r.then(calc(mh, env)) as any
      return calc(mh, env)(r)
    }, request as ForwardResult)

    if (resp instanceof Promise) return resp.then(createHandlerResult) as any

    return createHandlerResult(resp)
  })
}

function forward(resp: Response<any> | Next<any>) {
  return isNext(resp) ? resp.request : resp
}

function calc<E = {}>(mh: Middleware<E> | Handler<E>, env: E) {
  return (r: Request<any> | Response<any>): ForwardResult => {
    if (isResponse(r)) return r
    if (isHandler(mh)) return mh(r)(env)

    const result = mh(r)(env)

    if (result instanceof Promise) {
      return result.then(forward) as any
    }

    return forward(result)
  }
}

function createHandlerResult(
  resp: Response<any> | Request<any>,
): Response<any> {
  if (isRequest(resp)) {
    console.error('route not handled with the following request:')
    console.error(JSON.stringify(resp)) // Tratar como erro
    return Response({
      data: {
        message: 'Internal server error',
      },
      metadata: {
        headers: {
          status: 500,
        },
      },
    })
  }

  return resp
}
