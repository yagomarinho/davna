import { isLeft } from '../../../shared/core/either'
import { Handler } from '../../../shared/core/handler'
import { Repository, Writable } from '../../../shared/core/repository'
import { Response } from '../../../shared/core/response'
import { Lead } from '../entities/lead'
import { appendLead } from '../services/append.lead'

interface Env {
  leads: Writable<Repository<Lead>>
}

export const appendLeadHandler = Handler(request => async ({ leads }: Env) => {
  const { lead } = request.data

  const result = await appendLead({ lead })({ leads })

  if (isLeft(result))
    return Response({
      data: { message: 'Invalid Lead Contact' },
      metadata: {
        status: 400,
      },
    })

  return Response.data(result.value)
})
