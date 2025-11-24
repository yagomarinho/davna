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
