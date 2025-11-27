import type { Signer } from '@davna/providers'
import { Handler, isLeft, Repository, Response } from '@davna/core'
import { tokenFromBearer } from '@davna/utils'

import { Session } from '../entities/session'
import { verifySession } from '../services/verify.session'
import { ConfigDTO } from '../dtos/config'

interface Env {
  sessions: Repository<Session>
  signer: Signer
  config: ConfigDTO
}

export const verifySessionHandler = Handler(
  request =>
    async ({ sessions, signer, config }: Env) => {
      const refresh_strategy = request.metadata.query.refreshStrategy
      const user_agent = request.metadata.headers['user-agent'] ?? ''
      const bearer =
        (request.metadata.headers[config.auth.jwt.token.headerName] as
          | string
          | undefined) ?? ''

      if (!bearer) throw new Error('Invalid Session')

      const signature = tokenFromBearer(bearer)

      const result = await verifySession({
        signature,
        user_agent,
        refresh_strategy,
      })({
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
