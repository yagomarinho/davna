import { string } from 'yup'
import { Left, Repository, Right, Service, Writable } from '@davna/core'

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
      try {
        const phoneRegExp = /^(?:\(\d{2,4}\)|\d{2,4})\s?\d{5}-?\d{4}$/
        const phoneSchema = string()
          .matches(phoneRegExp, 'Phone number is not valid')
          .required()

        const phone = normalizePhone(await phoneSchema.validate(lead))

        const l = await leads.set(Lead.create({ id: phone }))

        return Right(l)
      } catch (e: any) {
        return Left({
          status: 'error',
          message: e.errors ? e.errors.join('; ') : e.message,
        })
      }
    },
)

function normalizePhone(phone: string) {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}
