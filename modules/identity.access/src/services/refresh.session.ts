/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Signer } from '@davna/infra'
import { Left, QueryBuilder, Repository, Right, Service } from '@davna/core'

import { ConfigDTO } from '../dtos/config'
import { Account, createSession, Session } from '../entities'

interface Request {
  signature: string
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
  signer: Signer
  accounts: Repository<Account>
  sessions: Repository<Session>
  config: ConfigDTO
}

export const refreshSession = Service<Request, Env, TokenResponse>(
  ({ signature, user_agent, idempotency_key }: Request) =>
    async ({ signer, sessions, accounts, config }: Env) => {
      try {
        const [alreadyDone] = await sessions.methods.query(
          QueryBuilder()
            .filterBy('_idempotency_key', '==', idempotency_key)
            .build(),
        )

        if (alreadyDone)
          return Left({ status: 'error', message: 'Already done' })

        const now = new Date()
        let [session] = await sessions.methods.query(
          QueryBuilder().filterBy('refresh_token', '==', signature).build(),
        )

        if (!session || session.props.expiresIn < new Date()) {
          if (session) await sessions.methods.remove(session.meta.id)
          return Left({ status: 'error', message: 'Invalid Signature' })
        }

        const account = await accounts.methods.get(session.props.account_id)

        if (!account) {
          if (session) await sessions.methods.remove(session.meta.id)
          return Left({ status: 'error', message: 'Invalid Account Session' })
        }

        let token: string = signature
        let refresh_token: string = session.props.refresh_token

        const { token: tokenConfig, refresh_token: refreshTokenConfig } =
          config.auth.jwt

        const tokenExpiresIn = now.getTime() + tokenConfig.expiresIn
        let refreshTokenExpiresIn = session.props.expiresIn.getTime()

        if (
          session.props.expiresIn <
          new Date(now.getTime() + 24 * 60 * 60 * 1000)
        ) {
          refreshTokenExpiresIn = now.getTime() + refreshTokenConfig.expiresIn

          refresh_token = signer.sign({
            subject: session.props.account_id,
            expiresIn: refreshTokenConfig.expiresIn,
          })

          session = createSession(
            {
              account_id: session.props.account_id,
              user_agent,
              refresh_token,
              expiresIn: new Date(now.getTime() + refreshTokenConfig.expiresIn),
            },
            session.meta,
          )

          session = await sessions.methods.set(session, idempotency_key)
        }

        token = signer.sign({
          subject: session.meta.id,
          expiresIn: tokenConfig.expiresIn,
        })

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
