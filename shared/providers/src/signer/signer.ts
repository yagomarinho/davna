export interface Payload {
  subject: string
  expiresIn: number
}

export interface Signer {
  sign: (payload: Payload) => string
  decode: (signature: string) => Payload
}
