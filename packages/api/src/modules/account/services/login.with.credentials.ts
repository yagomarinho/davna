import { Query, Repository } from '../../../shared/core/repository'
import { Left, Right } from '../../../shared/core/either'

import { Session } from '../entities/session'
import { Service } from '../../../shared/core/service'
import { Account } from '../entities/account'

import config from '../../../config'
import { Auth } from '../helpers/auth'
import { Signer } from '../helpers/signer'

interface Request {
  email: string
  password: string
  user_agent: string
}

interface Token {
  value: string
  expiresIn: number
}

interface TokenResponse {
  token: Token
  refresh_token: Token
}

interface Env {
  auth: Auth
  signer: Signer
  sessions: Repository<Session>
  accounts: Repository<Account>
}

export const loginWithCredentials = Service<Request, Env, TokenResponse>(
  ({ email, password, user_agent }) =>
    async ({ auth, signer, sessions, accounts }) => {
      try {
        const now = new Date()
        const user = await auth.authenticate(email, password)

        let [account] = await accounts.query(
          Query.where('external_ref', '==', user.id),
        )

        if (!account) {
          account = Account.create({
            name: user.name,
            external_ref: user.id,
          })

          account = await accounts.set(account)
        }

        const { token: tokenConfig, refresh_token: refreshTokenConfig } =
          config.auth.jwt

        const refresh_token = signer.sign({
          subject: account.id,
          expiresIn: refreshTokenConfig.expiresIn,
        })

        let session = Session.create({
          account_id: account.id,
          user_agent,
          refresh_token,
          expiresIn: new Date(Date.now() + refreshTokenConfig.expiresIn),
        })

        session = await sessions.set(session)

        const token = signer.sign({
          subject: session.id,
          expiresIn: tokenConfig.expiresIn,
        })

        const response = {
          token: {
            value: token,
            expiresIn: now.getTime() + tokenConfig.expiresIn,
          },
          refresh_token: {
            value: refresh_token,
            expiresIn: now.getTime() + refreshTokenConfig.expiresIn,
          },
        }

        return Right(response)
      } catch {
        return Left({ status: 'error', message: 'Invalid credentials' })
      }
    },
)
