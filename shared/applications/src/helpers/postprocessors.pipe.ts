import { Handler, Postprocessor, Response } from '@davna/core'

export function PostprocessorsPipe<E = {}>(
  handler: Handler<E>,
  ...processors: Postprocessor<E>[]
): Handler<E> {
  return Handler<E>(request => (env): any => {
    const resp = processors.reduce(
      (r, p) =>
        r instanceof Promise ? r.then(apply(p, env)) : apply(p, env)(r),
      handler(request)(env),
    )

    return resp
  })
}

function apply<E = {}>(processor: Postprocessor<E>, env: E) {
  return (response: Response) => processor(response)(env)
}
