/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Signer } from '@davna/infra'
import {
  createAuthContext,
  Left,
  QueryBuilder,
  Repository,
  Right,
  Service,
} from '@davna/core'

import { ConfigDTO } from '../dtos/config'
import { Account, createSession, Session, SESSION_KIND } from '../entities'

interface Request {
  signature: string
  user_agent: string
}

interface Token {
  value: string
  expires_at: number
}

interface TokenResponse {
  account: Account
  token: Token
  refresh_token: Token
}
interface Env {
  signer: Signer
  accounts: Repository<Account>
  sessions: Repository<Session>
  config: ConfigDTO
}

export const refreshSession = Service<Request, Env, TokenResponse>(
  ({ signature, user_agent }: Request) =>
    async ({ signer, sessions, accounts, config }: Env) => {
      try {
        const now = new Date()
        let {
          data: [session],
        } = await sessions.methods.query(
          QueryBuilder().filterBy('refresh_token', '==', signature).build(),
        )

        if (!session || session.props.kind === SESSION_KIND.DELEGATED) {
          if (session && session.props.expires_at < new Date())
            await sessions.methods.remove(session.meta.id)
          return Left({ status: 'error', message: 'Invalid Signature' })
        }

        const account = await accounts.methods.get(
          session.props.metadata.props.actor.subject_id,
        )

        if (!account) {
          if (session) await sessions.methods.remove(session.meta.id)
          return Left({ status: 'error', message: 'Invalid Account Session' })
        }

        let token: string = signature
        let refresh_token: string = session.props.refresh_token

        const { token: tokenConfig, refresh_token: refreshTokenConfig } =
          config.auth.jwt

        const tokenExpiresAt = now.getTime() + tokenConfig.expiresIn
        let refreshtokenExpiresAt = session.props.expires_at.getTime()

        if (
          session.props.expires_at <
          new Date(now.getTime() + 24 * 60 * 60 * 1000)
        ) {
          refreshtokenExpiresAt = now.getTime() + refreshTokenConfig.expiresIn

          refresh_token = signer.sign({
            subject: session.props.metadata.props.actor.subject_id,
            expiresIn: refreshTokenConfig.expiresIn,
          })

          session = createSession(
            {
              kind: SESSION_KIND.GENERATED,
              metadata: createAuthContext({ id: account.meta.id }),
              user_agent,
              refresh_token,
              expires_at: new Date(
                now.getTime() + refreshTokenConfig.expiresIn,
              ),
            },
            session.meta,
          )

          session = await sessions.methods.set(session)
        }

        token = signer.sign({
          subject: session.meta.id,
          expiresIn: tokenConfig.expiresIn,
        })

        const response = {
          account,
          token: {
            value: token,
            expires_at: tokenExpiresAt,
          },
          refresh_token: {
            value: refresh_token,
            expires_at: refreshtokenExpiresAt,
          },
        }

        return Right(response)
      } catch {
        return Left({ status: 'error', message: 'Invalid Signature' })
      }
    },
)
