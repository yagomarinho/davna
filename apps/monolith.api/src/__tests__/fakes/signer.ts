/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Signer } from '@davna/infra'

export function makeSigner(): Signer {
  const decode: Signer['decode'] = signature => JSON.parse(signature)

  const sign: Signer['sign'] = ({ expiresIn, subject }) =>
    JSON.stringify({ subject, expiresIn: Date.now() + expiresIn })

  return {
    decode,
    sign,
  }
}
