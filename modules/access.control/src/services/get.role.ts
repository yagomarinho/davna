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
