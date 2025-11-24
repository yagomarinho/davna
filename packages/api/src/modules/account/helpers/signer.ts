import jwt from 'jsonwebtoken'

export interface Payload {
  subject: string
  expiresIn: number
}

export interface Signer {
  sign: (payload: Payload) => string
  decode: (signature: string) => Payload
}

export interface Options {
  secret: string
}

export function Signer({ secret }: Options): Signer {
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
