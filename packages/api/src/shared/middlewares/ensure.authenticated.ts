import { Middleware } from '../core/middleware'
import { Next } from '../core/next'
import { Repository } from '../core/repository'
import { Response } from '../core/response'
import { Request } from '../core/request'

import { Account } from '../../modules/account/entities/account'
import { Session } from '../../modules/account/entities/session'
import { Signer } from '../../modules/account/helpers/signer'
import { tokenFromBearer } from '../utils/token.from.bearer'
import config from '../../config'
import { getSessionInfo } from '../services/get.session.info'
import { isLeft } from '../core/either'

interface Env {
  signer: Signer
  accounts: Repository<Account>
  sessions: Repository<Session>
}

export const ensureAuthenticated = Middleware<Env>(
  request =>
    async ({ signer, sessions, accounts }): Promise<any> => {
      const bearer = request.metadata.headers[
        config.auth.jwt.token.headerName
      ] as string | undefined

      if (!bearer)
        return Response({
          data: { message: 'Not Authorized. JWT Token is Missing' },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })

      const token = tokenFromBearer(bearer)

      const result = await getSessionInfo(token)({
        signer,
        sessions,
        accounts,
      })

      if (isLeft(result))
        return Response({
          data: {
            message: `Not Authorized for Reason: ${result.value.message}`,
          },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })

      const { session, account } = result.value

      return Next({
        request: Request({
          data: request.data,
          metadata: {
            ...request.metadata,
            account,
            session,
          },
        }),
      })
    },
)
