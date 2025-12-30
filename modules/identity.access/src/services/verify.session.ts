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
  Repository,
  Right,
  Service,
} from '@davna/core'

import { Account, createSession, Session, SESSION_KIND } from '../entities'
import { ConfigDTO } from '../dtos/config'

interface Token {
  value: string
  expires_at: number
}

interface TokenResponse {
  account: Account
  token: Token
  refresh_token: Token
}

export enum REFRESH_STRATEGY {
  FORCE = 'force',
  LAX = 'lax',
  NEVER = 'never',
}

interface Request {
  signature: string
  user_agent: string
  refresh_strategy?: REFRESH_STRATEGY
}

interface Env {
  signer: Signer
  accounts: Repository<Account>
  sessions: Repository<Session>
  config: ConfigDTO
}

export const verifySession = Service<Request, Env, TokenResponse>(
  ({ signature, user_agent, refresh_strategy = REFRESH_STRATEGY.LAX }) =>
    async ({ signer, accounts, sessions, config }) => {
      try {
        const now = new Date()
        const payload = signer.decode(signature)

        let session = await sessions.methods.get(payload.subject)

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

        let tokenExpiresAt = payload.expiresIn
        let refreshtokenExpiresAt = session.props.expires_at.getTime()

        const { token: tokenConfig, refresh_token: refreshTokenConfig } =
          config.auth.jwt

        if (refresh_strategy === REFRESH_STRATEGY.FORCE) {
          tokenExpiresAt = now.getTime() + tokenConfig.expiresIn
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
              expires_at: new Date(refreshtokenExpiresAt),
            },
            session.meta,
          )

          session = await sessions.methods.set(session)

          token = signer.sign({
            subject: session.meta.id,
            expiresIn: tokenConfig.expiresIn,
          })
        } else if (refresh_strategy === REFRESH_STRATEGY.LAX) {
          tokenExpiresAt = now.getTime() + tokenConfig.expiresIn

          if (
            session.props.expires_at <
            new Date(now.getTime() + 24 * 60 * 60 * 1000)
          ) {
            refreshtokenExpiresAt = now.getTime() + refreshTokenConfig.expiresIn

            refresh_token = signer.sign({
              subject: account.meta.id,
              expiresIn: refreshTokenConfig.expiresIn,
            })

            session = createSession(
              {
                kind: SESSION_KIND.GENERATED,
                metadata: createAuthContext({ id: account.meta.id }),
                user_agent,
                refresh_token,
                expires_at: new Date(refreshtokenExpiresAt),
              },
              session.meta,
            )

            session = await sessions.methods.set(session)
          }

          token = signer.sign({
            subject: session.meta.id,
            expiresIn: tokenConfig.expiresIn,
          })
        }

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
