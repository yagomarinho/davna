/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
