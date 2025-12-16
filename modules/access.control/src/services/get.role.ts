/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Left, Repository, Right, Service } from '@davna/core'
import { Role } from '../entities'

interface Env {
  roles: Repository<Role>
}

export const getRole = Service((role_id: string) => async ({ roles }: Env) => {
  const role = await roles.get(role_id)

  if (!role)
    return Left({
      status: 'failed',
      message: `Role not found with id: ${role_id}`,
    })

  return Right(role)
})
