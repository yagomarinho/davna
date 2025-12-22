/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface UnitOfWork {
  readonly start: () => any
  readonly commit: () => any
  readonly rollback: () => any
}
