import { Handler, isLeft, Repository, Response } from '@davna/core'

import { Session } from '../entities/session'
import { revokeSession } from '../services/revoke.session'

interface Env {
  sessions: Repository<Session>
}

export const revokeSessionHandler = Handler(
  request =>
    async ({ sessions }: Env) => {
      const { id } = request.metadata.session

      const result = await revokeSession({ session_id: id })({
        sessions,
      })

      if (isLeft(result))
        return Response({
          data: { message: result.value.message },
          metadata: {
            headers: {
              status: 400,
            },
          },
        })

      return Response.metadata({
        headers: {
          status: 204,
        },
      })
    },
)
