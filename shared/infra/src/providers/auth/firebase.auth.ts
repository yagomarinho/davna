/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { firebaseAdmin } from './firebase.admin.app'
import { Auth, User } from './auth'

function firebaseAuth(app: App = firebaseAdmin()) {
  return getAuth(app)
}

interface Config {
  providers: {
    firebase: {
      apiKey: string
    }
  }
}

export interface AuthOptions {
  config: Config
}

export function FirebaseAdminAuth({ config }: AuthOptions): Auth {
  const auth = firebaseAuth()

  async function authenticate(email: string, password: string) {
    const idToken = await getIdToken(email, password, config)

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

async function getIdToken(
  email: string,
  password: string,
  config: Config,
): Promise<string> {
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
