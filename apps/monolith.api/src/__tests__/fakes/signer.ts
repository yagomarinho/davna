import { Signer } from '@davna/providers'

export function makeSigner(): Signer {
  const decode: Signer['decode'] = signature => JSON.parse(signature)

  const sign: Signer['sign'] = ({ expiresIn, subject }) =>
    JSON.stringify({ subject, expiresIn: Date.now() + expiresIn })

  return {
    decode,
    sign,
  }
}
