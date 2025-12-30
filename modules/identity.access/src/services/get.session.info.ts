/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Signer } from '@davna/infra'
import { Left, Readable, Repository, Right, Service } from '@davna/core'

import { Account, Session, SESSION_KIND } from '../entities'

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

        const session = await sessions.methods.get(session_id)

        if (!session || session.props.kind === SESSION_KIND.DELEGATED)
          throw new Error('No session founded')

        const account = await accounts.methods.get(
          session.props.metadata.props.actor.subject_id,
        )

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
