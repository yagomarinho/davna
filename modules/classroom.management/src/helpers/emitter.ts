/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface Emitter {
  on: (event: string, listener: any) => any
  off: (event: string, listener: any) => any
  emit: (event: string, data?: any) => any
}

export function Emitter(): Emitter {
  const on: Emitter['on'] = () => {}

  const off: Emitter['off'] = () => {}

  const emit: Emitter['emit'] = () => {}

  return {
    on,
    off,
    emit,
  }
}
