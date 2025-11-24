import config from '../../../config'
import { Identifier } from '../../../shared/core/entity'
import { firebaseAuth } from './firebase.auth'

export interface User extends Identifier {
  name: string
}

export interface Auth {
  authenticate: (email: string, password: string) => Promise<User>
  getUser: (id: string) => Promise<User>
}

async function getIdToken(email: string, password: string): Promise<string> {
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.providers.firebase.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  )

  if (resp.ok) {
    const r = await resp.json()

    return r.idToken
  }

  throw new Error('Invalid Credentials')
}

export function Auth(): Auth {
  const auth = firebaseAuth()

  async function authenticate(email: string, password: string) {
    const idToken = await getIdToken(email, password)

    const decodedToken = await auth.verifyIdToken(idToken)

    return getUser(decodedToken.uid)
  }

  async function getUser(id: string): Promise<User> {
    const { displayName: name } = await auth.getUser(id)

    return {
      id,
      name: name || 'anonymous user',
    }
  }

  return {
    authenticate,
    getUser,
  }
}
