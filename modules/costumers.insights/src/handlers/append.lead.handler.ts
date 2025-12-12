import { Handler, Repository, Response, Writable } from '@davna/core'

import { Lead } from '../entities/lead'
import { appendLead } from '../services/append.lead'

interface Env {
  leads: Writable<Repository<Lead>>
}

export const appendLeadHandler = Handler(request => async ({ leads }: Env) => {
  const { lead } = request.data

  const result = await appendLead({ lead })({ leads })

  return Response.data(result.value)
})
