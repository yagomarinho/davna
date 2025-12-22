/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Repository, Right, Service, Writable } from '@davna/core'

import { createLead, Lead } from '../entities/lead'

interface Request {
  lead: string
}

interface Env {
  leads: Writable<Repository<Lead>>
}

export const appendLead = Service<Request, Env, Lead>(
  ({ lead }) =>
    async ({ leads }) => {
      const l = await leads.methods.set(createLead({ lead }))
      return Right(l)
    },
)
