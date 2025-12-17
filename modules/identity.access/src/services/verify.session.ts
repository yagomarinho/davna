/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Signer } from '@davna/infra'
import { Left, Repository, Right, Service } from '@davna/core'

import { Account, Session } from '../entities'
import { ConfigDTO } from '../dtos/config'

interface Token {
  value: string
  expiresIn: number
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

        let session = await sessions.get(payload.subject)

        if (!session || session.expiresIn < new Date()) {
          if (session) await sessions.remove(session)
          return Left({ status: 'error', message: 'Invalid Signature' })
        }

        const account = await accounts.get(session.account_id)

        if (!account) {
          if (session) await sessions.remove(session)
          return Left({ status: 'error', message: 'Invalid Account Session' })
        }

        let token: string = signature
        let refresh_token: string = session.refresh_token

        let tokenExpiresIn = payload.expiresIn
        let refreshTokenExpiresIn = session.expiresIn.getTime()

        const { token: tokenConfig, refresh_token: refreshTokenConfig } =
          config.auth.jwt

        if (refresh_strategy === REFRESH_STRATEGY.FORCE) {
          tokenExpiresIn = now.getTime() + tokenConfig.expiresIn
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
            expiresIn: new Date(refreshTokenExpiresIn),
            updated_at: now,
          })

          session = await sessions.set(session)

          token = signer.sign({
            subject: session.id,
            expiresIn: tokenConfig.expiresIn,
          })
        } else if (refresh_strategy === REFRESH_STRATEGY.LAX) {
          tokenExpiresIn = now.getTime() + tokenConfig.expiresIn

          if (
            session.expiresIn < new Date(now.getTime() + 24 * 60 * 60 * 1000)
          ) {
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
              expiresIn: new Date(refreshTokenExpiresIn),
              updated_at: new Date(),
            })

            session = await sessions.set(session)
          }

          token = signer.sign({
            subject: session.id,
            expiresIn: tokenConfig.expiresIn,
          })
        }

        const response = {
          account,
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
