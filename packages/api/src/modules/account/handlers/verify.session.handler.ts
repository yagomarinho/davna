import config from '../../../config'
import { isLeft } from '../../../shared/core/either'
import { Handler } from '../../../shared/core/handler'
import { Repository } from '../../../shared/core/repository'
import { Response } from '../../../shared/core/response'
import { tokenFromBearer } from '../../../shared/utils/token.from.bearer'
import { Session } from '../entities/session'
import { Signer } from '../helpers/signer'
import { verifySession } from '../services/verify.session'

interface Env {
  sessions: Repository<Session>
  signer: Signer
}

export const verifySessionHandler = Handler(
  request =>
    async ({ sessions, signer }: Env) => {
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
