/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface Converter<V, P = any> {
  to: (value: V) => P
  from: (value: P) => V
}

export type ReadonlyConverter<C extends Converter<any>> = {
  from: C['from']
}

export type WriteonlyConverter<C extends Converter<any>> = {
  to: C['to']
}
