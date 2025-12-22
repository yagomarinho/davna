/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Auth, Signer } from '@davna/infra'
import { Left, QueryBuilder, Repository, Right, Service } from '@davna/core'

import { createSession, Session } from '../entities/session'
import { Account, createAccount } from '../entities/account'
import { ConfigDTO } from '../dtos/config'

interface Request {
  email: string
  password: string
  user_agent: string
  idempotency_key: string
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
  ({ email, password, user_agent, idempotency_key }) =>
    async ({ auth, signer, sessions, accounts, config }) => {
      try {
        const [alreadyDone] = await sessions.methods.query(
          QueryBuilder()
            .filterBy('_idempotency_key', '==', idempotency_key)
            .build(),
        )

        if (alreadyDone)
          return Left({ status: 'error', message: 'Already done' })

        const now = new Date()
        const user = await auth.authenticate(email, password)

        let [account] = await accounts.methods.query(
          QueryBuilder().filterBy('external_ref', '==', user.id).build(),
        )

        if (!account) {
          account = await accounts.methods.set(
            createAccount({
              name: user.name,
              external_ref: user.id,
              roles: [],
            }),
          )
        }

        const { token: tokenConfig, refresh_token: refreshTokenConfig } =
          config.auth.jwt

        const refresh_token = signer.sign({
          subject: account.meta.id,
          expiresIn: refreshTokenConfig.expiresIn,
        })

        const session = await sessions.methods.set(
          createSession({
            account_id: account.meta.id,
            user_agent,
            refresh_token,
            expiresIn: new Date(Date.now() + refreshTokenConfig.expiresIn),
          }),
        )

        const token = signer.sign({
          subject: session.meta.id,
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
