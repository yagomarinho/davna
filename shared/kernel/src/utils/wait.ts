/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function wait(milis: number = 1000) {
  return new Promise(resolve => {
    setTimeout(resolve, milis)
  })
}
