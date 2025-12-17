/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Auth, Signer } from '@davna/infra'
import { Left, Query, Repository, Right, Service } from '@davna/core'

import { Session } from '../entities/session'
import { Account } from '../entities/account'
import { ConfigDTO } from '../dtos/config'

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
  account: Account
  token: Token
  refresh_token: Token
}

interface Env {
  auth: Auth
  signer: Signer
  sessions: Repository<Session>
  accounts: Repository<Account>
  config: ConfigDTO
}

export const loginWithCredentials = Service<Request, Env, TokenResponse>(
  ({ email, password, user_agent }) =>
    async ({ auth, signer, sessions, accounts, config }) => {
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
          account,
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
