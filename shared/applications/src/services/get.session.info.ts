import { Left, Readable, Repository, Right, Service } from '@davna/core'

import { Account } from '../../modules/account/entities/account'
import { Session } from '../../modules/account/entities/session'
import { Signer } from '../../modules/account/helpers/signer'

interface Env {
  signer: Signer
  sessions: Readable<Repository<Session>>
  accounts: Readable<Repository<Account>>
}

export const getSessionInfo = Service(
  (token: string) =>
    async ({ signer, sessions, accounts }: Env) => {
      try {
        const { subject: session_id } = signer.decode(token)

        const session = await sessions.get(session_id)

        if (!session) throw new Error('No session founded')

        const account = await accounts.get(session.account_id)

        if (!account) throw new Error('No account founded')

        const updatedRequest = {
          account,
          session,
        }

        return Right(updatedRequest)
      } catch (e: any) {
        return Left({ status: 'error', message: e.message })
      }
    },
)
