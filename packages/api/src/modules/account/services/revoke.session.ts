import { Repository } from '../../../shared/core/repository'
import { Left, Right } from '../../../shared/core/either'

import { Session } from '../entities/session'
import { Service } from '../../../shared/core/service'

interface Request {
  session_id: string
}

interface Env {
  sessions: Repository<Session>
}

export const revokeSession = Service<Request, Env, void>(
  ({ session_id }) =>
    async ({ sessions }) => {
      const session = await sessions.get(session_id)

      if (!session || session.expiresIn < new Date()) {
        if (session) await sessions.remove(session)
        return Left({ status: 'error', message: 'Session already revoked' })
      }

      await sessions.remove(session)

      return Right()
    },
)
