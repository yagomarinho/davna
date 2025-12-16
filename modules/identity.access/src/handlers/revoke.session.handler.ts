/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
