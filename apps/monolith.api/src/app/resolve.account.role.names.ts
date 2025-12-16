/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Account } from '@davna/account'
import { Postprocessor, Query, Repository, Response } from '@davna/core'
import { Role } from '@davna/role'

interface Data {
  account: Account
}

interface Env {
  roles: Repository<Role>
}

export const resolveAccountRoleNames = Postprocessor<Env, Data>(
  response => async env => {
    const { account } = response.data

    if (account) {
      const roles = await env.roles.query(
        Query.where('id', 'in', account.roles),
      )

      return Response.data(
        {
          ...response.data,
          account: { ...account, roles: roles.map(role => role.name) },
        },
        response,
      )
    }

    return response
  },
)
