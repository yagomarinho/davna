/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resolvable } from '@davna/core'
import { ExecutionContext } from './execution.context'

export interface Postprocessor<Input = any, Output = any, Env = any> {
  (data: Input, env: Env, ctx: ExecutionContext): Resolvable<Output>
}
