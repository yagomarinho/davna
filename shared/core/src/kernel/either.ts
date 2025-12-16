export interface Left<L> extends Tag<'left'> {
  readonly value: L
}

export interface Right<R> extends Tag<'right'> {
  readonly value: R
}

export type Either<L, R> = Left<L> | Right<R>

export function Right(): Right<void>
export function Right<R>(value: R): Right<R>
export function Right<R>(value?: any): Right<R> {
  return applyTag('right')({ value })
}

export function Left(): Left<void>
export function Left<L>(value: L): Left<L>
export function Left<L>(value?: any): Left<L> {
  return applyTag('left')({ value })
}

export function Either<L, R>(condition: (value: L | R) => value is R) {
  return (value: L | R): Either<L, R> =>
    condition(value) ? Right(value) : Left(value)
}

export const isLeft = verifyTag('left')
export const isRight = verifyTag('right')
