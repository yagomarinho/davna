/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const CurryURI = 'curry.fn'
export type CurryURI = typeof CurryURI

type CurriedParamsOf<F extends (...args: any[]) => any> = CurriedParams<
  Parameters<F>
>

type CurriedParams<
  P extends any[],
  Q extends any[] = [],
  R extends any[] = [],
> = 0 extends P['length']
  ? R
  : P extends [infer A, ...infer Rest]
    ? CurriedParams<Rest, [...Q, A], R | [...Q, A]>
    : never

type BuildTuple<N extends number, T extends any[] = []> = T['length'] extends N
  ? T
  : BuildTuple<N, [...T, any]>

type Dec<N extends number> =
  BuildTuple<N> extends [any, ...infer Rest] ? Rest['length'] : 0

type GTE<M extends number, N extends number> = 0 extends M
  ? 0 extends N
    ? true
    : false
  : 0 extends N
    ? true
    : GTE<Dec<M>, Dec<N>>

type RestOfParams<
  F extends (...args: any[]) => any,
  P extends CurriedParamsOf<F>,
> =
  Parameters<F> extends [...BuildTuple<P['length']>, ...infer Rest]
    ? Rest
    : never

interface Curried<
  F extends (...args: any[]) => any,
  P extends CurriedParamsOf<F>,
> {
  <R extends CurriedParams<RestOfParams<F, P>>>(
    ...args: R
  ): [...P, ...R] extends CurriedParamsOf<F>
    ? CurriedFn<F, [...P, ...R]>
    : never

  readonly _t: CurryURI
}

export type CurriedFn<
  F extends (...args: any[]) => any,
  P extends CurriedParamsOf<F> = [],
> =
  GTE<P['length'], Parameters<F>['length']> extends true
    ? ReturnType<F>
    : Curried<F, P>

export function curry<
  F extends (this: any, ...args: any[]) => any,
  P extends CurriedParamsOf<F>,
>(this: ThisParameterType<F>, fn: F, ...args: P): CurriedFn<F, P> {
  function prepare(this: ThisParameterType<F>, ...newArgs: any[]) {
    return curry.apply(this, [fn, ...args, ...newArgs] as any)
  }

  prepare._t = CurryURI

  return args.length >= fn.length
    ? fn.apply(this, args)
    : (prepare.bind(this) as any)
}

export function isCurry(fn: any): fn is CurriedFn<any> {
  return (
    (typeof fn === 'function' || typeof fn === 'object') &&
    '_t' in fn &&
    fn._t === CurryURI
  )
}
