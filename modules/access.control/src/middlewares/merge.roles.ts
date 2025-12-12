import {
  Entity,
  Middleware,
  Next,
  Query,
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

      const roles = await env.roles.query(
        Query.where('id', 'in', account.roles),
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
