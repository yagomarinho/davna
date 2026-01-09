/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface ExecutionContext {
  idempotency_key: string
  request_id: string
  correlation_id?: string
  timestamp: number
  origin: 'http' | 'ws' | 'emitter'
}
