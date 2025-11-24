import config from '../../../config'
import { isLeft } from '../../../shared/core/either'
import { Handler } from '../../../shared/core/handler'
import { Repository } from '../../../shared/core/repository'
import { Response } from '../../../shared/core/response'
import { tokenFromBearer } from '../../../shared/utils/token.from.bearer'
import { Session } from '../entities/session'
import { Signer } from '../helpers/signer'
import { refreshSession } from '../services/refresh.session'

interface Env {
  sessions: Repository<Session>
  signer: Signer
}

export const refreshSessionHandler = Handler(
  request =>
    async ({ sessions, signer }: Env) => {
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
