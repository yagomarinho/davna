/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createHmac, timingSafeEqual } from 'crypto'

export function verifySignature(
  signature: string,
  secret: string,
  bodyString: string,
): boolean {
  const calculatedSignature = `sha256=${createHmac('sha256', secret).update(bodyString).digest('hex')}`

  const isTrustedPayload = timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(signature),
  )

  return isTrustedPayload
}
