/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function randomId() {
  return Array.from({ length: 10 }, () => Math.round(Math.random() * 10)).join(
    '',
  )
}
