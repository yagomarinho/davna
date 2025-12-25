/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Auth, Signer } from '@davna/infra'
import { Handler, isLeft, Repository, Response } from '@davna/core'

import { Account } from '../entities/account'
import { Session } from '../entities/session'

import { loginWithCredentials } from '../services/login.with.credentials'
import { ConfigDTO } from '../dtos/config'

interface Env {
  auth: Auth
  signer: Signer
  sessions: Repository<Session>
  accounts: Repository<Account>
  config: ConfigDTO
}

export const loginWithCredentialsHandler = Handler(
  request =>
    async ({ accounts, sessions, auth, signer, config }: Env) => {
      const { email, password } = request.data
      const user_agent: string = request.metadata.headers['user-agent']

      const result = await loginWithCredentials({
        email,
        password,
        user_agent,
      })({
        accounts,
        sessions,
        auth,
        signer,
        config,
      })

      if (isLeft(result))
        return Response({
          data: { message: 'Unauthorized to login' },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })

      return Response.data(result.value)
    },
)
