import type { Signer } from '@davna/providers'
import {
  isLeft,
  Middleware,
  Next,
  Repository,
  Request,
  Response,
} from '@davna/core'
import { tokenFromBearer } from '@davna/utils'

import { Account, Session } from '../entities'
import { getSessionInfo } from '../services/get.session.info'

interface Env {
  signer: Signer
  accounts: Repository<Account>
  sessions: Repository<Session>
  config: {
    auth: {
      jwt: {
        token: {
          headerName: string
        }
      }
    }
  }
}

export const ensureAuthenticated = Middleware<Env>(
  request =>
    async ({ signer, sessions, accounts, config }): Promise<any> => {
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

      let token: string
      try {
        token = tokenFromBearer(bearer)
      } catch {
        return Response({
          data: { message: 'Not Authorized. Invalid Bearer Token' },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })
      }

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
