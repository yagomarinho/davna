import { Repository, Right, Service, Writable } from '@davna/core'

import { Lead } from '../entities/lead'

interface Request {
  lead: string
}

interface Env {
  leads: Writable<Repository<Lead>>
}

export const appendLead = Service<Request, Env, Lead>(
  ({ lead }) =>
    async ({ leads }) => {
      const l = await leads.set(Lead.create({ id: lead }))
      return Right(l)
    },
)
