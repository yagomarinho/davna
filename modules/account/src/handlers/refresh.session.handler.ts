import type { Signer } from '@davna/providers'

import { Handler, isLeft, Repository, Response } from '@davna/core'
import { tokenFromBearer } from '@davna/utils'

import { Session } from '../entities/session'
import { refreshSession } from '../services/refresh.session'
import { ConfigDTO } from '../dtos/config'

interface Env {
  sessions: Repository<Session>
  signer: Signer
  config: ConfigDTO
}

export const refreshSessionHandler = Handler(
  request =>
    async ({ sessions, signer, config }: Env) => {
      const user_agent = request.metadata.headers['user-agent'] ?? ''
      const bearer =
        (request.metadata.headers[config.auth.jwt.refresh_token.headerName] as
          | string
          | undefined) ?? ''

      if (!bearer) throw new Error('Invalid Session')

      let signature: string

      try {
        signature = tokenFromBearer(bearer)
      } catch {
        return Response({
          data: { message: 'Invalid Session' },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })
      }

      const result = await refreshSession({
        signature,
        user_agent,
      })({
        sessions,
        signer,
        config,
      })

      if (isLeft(result))
        return Response({
          data: {
            message: 'Invalid Session',
          },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })

      return Response.data(result.value)
    },
)
