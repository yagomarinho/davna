/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Entity,
  Middleware,
  Next,
  QueryBuilder,
  Repository,
  Request,
} from '@davna/core'
import { Role } from '../entities'

interface Account extends Entity {
  roles: string[]
}

interface Metadata {
  account: Account
}

interface Env {
  roles: Repository<Role>
}

export const mergeRoles = Middleware<Env, any, Metadata>(
  request =>
    async (env): Promise<any> => {
      const { account } = request.metadata

      const roles = await env.roles.methods.query(
        QueryBuilder().filterBy('id', 'in', account.roles).build(),
      )

      return Next({
        request: Request({
          data: request.data,
          metadata: {
            ...request.metadata,
            account: {
              ...account,
              roles,
            },
          },
        }),
      })
    },
)
