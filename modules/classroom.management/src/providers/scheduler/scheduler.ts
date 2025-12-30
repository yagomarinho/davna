/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resolvable } from '@davna/core'

export interface ScheduleCommand<T = any> {
  type: string
  run_at: Date
  payload: T
}

export interface Scheduler {
  schedule: <T>(command: ScheduleCommand<T>) => Resolvable<void>
}
