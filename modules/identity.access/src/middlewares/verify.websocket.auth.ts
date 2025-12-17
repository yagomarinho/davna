/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Signer } from '@davna/infra'

import { Socket } from 'socket.io'
import { isLeft, Repository } from '@davna/core'

import { getSessionInfo } from '../services/get.session.info'
import { Account, Session } from '../entities'

type AuthedSocket = Socket & {
  data: {
    user?: any
    session?: any
  }
}

interface Env {
  repositories: {
    sessions: Repository<Session>
    accounts: Repository<Account>
  }
  providers: {
    signer: Signer
  }
}

export function verifyWebsocketAuth(env: Env) {
  return async (socket: AuthedSocket, next) => {
    try {
      const tokenFromAuth = socket.handshake.auth?.token as string | undefined
      const bearer = (
        socket.handshake.headers['authorization'] as string | undefined
      )?.replace(/^Bearer\s+/i, '')
      const token = tokenFromAuth || bearer

      if (!token) {
        const err: any = new Error('ERR_NO_TOKEN')
        err.data = {
          code: 'NO_TOKEN',
          reason: 'Not Authorized. JWT token is missing',
        }
        return next(err)
      }

      const result = await getSessionInfo(token)({
        signer: env.providers.signer,
        sessions: env.repositories.sessions,
        accounts: env.repositories.accounts,
      })

      if (isLeft(result)) {
        const err: any = new Error('ERR_UNAUTHORIZED')
        err.data = {
          code: 'UNAUTHORIZED',
          reason: `Not Authorized for reason: ${result.value.message}`,
        }
        return next(err)
      }

      const { account, session } = result.value
      socket.data.account = account
      socket.data.session = session

      return next()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)

      const err: any = new Error('ERR_AUTH_INTERNAL')
      err.data = {
        code: 'INTERNAL',
        reason: 'Internal Server Error',
      }
      return next(err)
    }
  }
}
