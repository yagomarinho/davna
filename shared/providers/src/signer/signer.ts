/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface Payload {
  subject: string
  expiresIn: number
}

export interface Signer {
  sign: (payload: Payload) => string
  decode: (signature: string) => Payload
}
