export function tokenFromBearer(bearer: string) {
  if (!(bearer.startsWith('Bearer ') || bearer.startsWith('bearer ')))
    throw new Error('Invalid Bearer token')

  const [, token] = bearer.split(' ')

  return token
}
