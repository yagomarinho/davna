import { Handler, isLeft, Repository, Response } from '@davna/core'

import { Account } from '../entities/account'
import { Session } from '../entities/session'

import { Auth } from '../helpers/auth'
import { Signer } from '../helpers/signer'

import { loginWithCredentials } from '../services/login.with.credentials'

interface Env {
  auth: Auth
  signer: Signer
  sessions: Repository<Session>
  accounts: Repository<Account>
}

export const loginWithCredentialsHandler = Handler(
  request =>
    async ({ accounts, sessions, auth, signer }: Env) => {
      const { email, password } = request.data
      const user_agent = request.metadata.headers['user-agent'] ?? ''

      const result = await loginWithCredentials({
        email,
        password,
        user_agent,
      })({
        accounts,
        sessions,
        auth,
        signer,
      })

      if (isLeft(result))
        return Response({
          data: { message: 'Unauthorized to login' },
          metadata: {
            status: 401,
          },
        })

      return Response.data(result.value)
    },
)
