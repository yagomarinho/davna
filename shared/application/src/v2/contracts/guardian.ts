/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resolvable } from '@davna/core'

import { Result } from './result'
import { ExecutionContext } from './execution.context'

export interface Guardian<Input = any, Output = any, Env = any, Error = any> {
  (
    request: Input,
    env: Env,
    ctx: ExecutionContext,
  ): Resolvable<Result<Error, Output>>
}
