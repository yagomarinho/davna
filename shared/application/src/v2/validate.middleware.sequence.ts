/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Middleware } from './contracts/middleware'

export type ValidateMiddleware<M extends Middleware, Input, Output> =
  M extends Middleware<infer I, infer O>
    ? I extends Input
      ? O extends Output
        ? M
        : never
      : never
    : never

export type ValidateMiddlewareSeq<
  MS extends Middleware[],
  Input,
  Output,
  Seq extends Middleware[] = [],
> = 0 extends MS['length']
  ? Seq
  : MS extends [infer A]
    ? A extends Middleware<infer I, infer O>
      ? I extends Input
        ? O extends Output
          ? [...Seq, A]
          : never
        : never
      : never
    : MS extends [infer A, ...infer Rest]
      ? A extends Middleware<infer I, infer O>
        ? I extends Input
          ? Rest extends Middleware[]
            ? ValidateMiddlewareSeq<Rest, O, Output, [...Seq, A]>
            : never
          : never
        : never
      : never
