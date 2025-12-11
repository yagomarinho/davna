import { object, string, mixed, date } from 'yup'

import { Entity } from '@davna/core'

import { Account_URI } from './uri'
import { Account } from './account'

export interface Account_v1Props {
  name: string
  external_ref: string
}

export interface Account_v1
  extends Account_v1Props, Entity<Account_URI, 'v1'> {}

export interface CreateAccount_v1Props
  extends Account_v1Props, Partial<Entity> {}

const v1Schema = object({
  id: string().optional(),
  created_at: date().optional(),
  updated_at: date().optional(),
  __version: string().oneOf(['v1']).optional(),
  name: string().required(),
  external_ref: string().required(),
  roles: mixed().test(
    'no-roles',
    'A chave "roles" não é permitida',
    (value, ctx) => {
      if (!ctx.originalValue || !('roles' in ctx.originalValue)) return true
      if (typeof value === 'undefined') return true
      return ctx.createError()
    },
  ),
})

export const Account_v1 = ({
  id = '',
  name,
  external_ref,
  created_at,
  updated_at,
}: CreateAccount_v1Props) => {
  const now = new Date()
  return Account(
    id,
    name,
    external_ref,
    [],
    created_at ?? now,
    updated_at ?? now,
  )
}

Account_v1.is_v1 = (data: unknown): data is CreateAccount_v1Props =>
  v1Schema.isValidSync(data, { strict: true })
