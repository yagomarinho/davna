/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents the "Left" side of an Either.
 *
 * Conventionally used to store error, failure, or alternative values.
 */
export interface Left<L = any> {
  readonly type: 'left'
  readonly value: L
}

/**
 * Represents the "Right" side of an Either.
 *
 * Conventionally used to store successful or expected values.
 */

export interface Right<R = any> {
  readonly type: 'right'
  readonly value: R
}

/**
 * Discriminated union representing a value that can be either
 * Left (failure) or Right (success).
 *
 * Provides a safe way to handle computations that may fail
 * without throwing exceptions.
 */

export type Either<L, R> = Left<L> | Right<R>

// -----------------
// Implementations
// -----------------

/**
 * Factory functions for creating Left values.
 *
 * Supports optional payload; defaults to void if no value provided.
 */

export function Left(): Left<void>
export function Left<L>(value: L): Left<L>
export function Left<L>(value?: any): Left<L> {
  return {
    type: 'left',
    value,
  }
}

/**
 * Factory functions for creating Right values.
 *
 * Supports optional payload; defaults to void if no value provided.
 */

export function Right(): Right<void>
export function Right<R>(value: R): Right<R>
export function Right<R>(value?: any): Right<R> {
  return {
    type: 'right',
    value,
  }
}

/**
 * Converts a value into an Either using a type guard condition.
 *
 * - If the condition passes, returns Right
 * - Otherwise, returns Left
 */

export function Either<L, R>(condition: (value: L | R) => value is R) {
  return (value: L | R): Either<L, R> =>
    condition(value) ? Right(value) : Left(value)
}

/**
 * - isLeft: returns true if the value is a Left
 */
export const isLeft = <L, R>(either: Either<L, R>): either is Left<L> =>
  either.type === 'left'

/**
 * - isRight: returns true if the value is a Right
 */
export const isRight = <L, R>(either: Either<L, R>): either is Right<R> =>
  either.type === 'right'
