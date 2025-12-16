/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Signer } from '@davna/providers'
import { Handler, isLeft, Repository, Response } from '@davna/core'
import { tokenFromBearer } from '@davna/utils'

import { Account, Session } from '../entities'
import { REFRESH_STRATEGY, verifySession } from '../services/verify.session'
import { ConfigDTO } from '../dtos/config'

interface Env {
  accounts: Repository<Account>
  sessions: Repository<Session>
  signer: Signer
  config: ConfigDTO
}

export const verifySessionHandler = Handler(
  request =>
    async ({ accounts, sessions, signer, config }: Env) => {
      const refresh_strategy: REFRESH_STRATEGY =
        request.metadata.query.refreshStrategy
      const user_agent: string = request.metadata.headers['user-agent']
      const bearer: string =
        request.metadata.headers[config.auth.jwt.token.headerName]

      if (!bearer)
        return Response({
          data: { message: 'Not Authorized. JWT is Missing' },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })

      let signature: string
      try {
        signature = tokenFromBearer(bearer)
      } catch {
        return Response({
          data: { message: 'Not Authorized. Invalid Token' },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })
      }

      const result = await verifySession({
        signature,
        user_agent,
        refresh_strategy,
      })({
        accounts,
        sessions,
        signer,
        config,
      })

      if (isLeft(result))
        return Response({
          data: { message: 'Invalid Session' },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })

      return Response.data(result.value)
    },
)
