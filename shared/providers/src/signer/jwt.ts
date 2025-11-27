import jwt from 'jsonwebtoken'

import { Signer } from './signer'

export interface Options {
  secret: string
}

export function JWTSigner({ secret }: Options): Signer {
  const sign: Signer['sign'] = ({ subject, expiresIn }) =>
    jwt.sign({}, secret, {
      subject,
      expiresIn,
    })

  const decode: Signer['decode'] = signature => {
    const dec = jwt.verify(signature, secret) as jwt.JwtPayload

    return {
      subject: dec.sub!,
      expiresIn: dec.exp!,
    }
  }

  return {
    sign,
    decode,
  }
}
