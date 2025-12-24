/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function removeKeyFrom<K extends PropertyKey, O extends Record<K, any>>(
  key: K,
  obj: O,
): Omit<O, K> {
  const { [key]: _, ...rest } = obj
  return rest
}
