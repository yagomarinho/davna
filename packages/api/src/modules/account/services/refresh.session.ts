import { Query, Repository } from '../../../shared/core/repository'
import { Left, Right } from '../../../shared/core/either'

import { Session } from '../entities/session'
import { Service } from '../../../shared/core/service'

import config from '../../../config'
import { Signer } from '../helpers/signer'

interface Request {
  signature: string
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
  signer: Signer
  sessions: Repository<Session>
}

export const refreshSession = Service<Request, Env, TokenResponse>(
  ({ signature, user_agent }: Request) =>
    async ({ signer, sessions }: Env) => {
      try {
        const now = new Date()
        let [session] = await sessions.query(
          Query.where('refresh_token', '==', signature),
        )

        if (!session || session.expiresIn < new Date()) {
          if (session) await sessions.remove(session)
          return Left({ status: 'error', message: 'Invalid Signature' })
        }

        let token: string = signature
        let refresh_token: string = session.refresh_token

        const { token: tokenConfig, refresh_token: refreshTokenConfig } =
          config.auth.jwt

        const tokenExpiresIn = now.getTime() + tokenConfig.expiresIn
        let refreshTokenExpiresIn = session.expiresIn.getTime()

        if (session.expiresIn < new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
          refreshTokenExpiresIn = now.getTime() + refreshTokenConfig.expiresIn

          refresh_token = signer.sign({
            subject: session.account_id,
            expiresIn: refreshTokenConfig.expiresIn,
          })

          session = Session.create({
            ...session,
            account_id: session.account_id,
            user_agent,
            refresh_token,
            expiresIn: new Date(now.getTime() + refreshTokenConfig.expiresIn),
            updated_at: new Date(),
          })

          session = await sessions.set(session)
        }

        token = signer.sign({
          subject: session.id,
          expiresIn: tokenConfig.expiresIn,
        })

        const response = {
          token: {
            value: token,
            expiresIn: tokenExpiresIn,
          },
          refresh_token: {
            value: refresh_token,
            expiresIn: refreshTokenExpiresIn,
          },
        }

        return Right(response)
      } catch {
        return Left({ status: 'error', message: 'Invalid Signature' })
      }
    },
)
