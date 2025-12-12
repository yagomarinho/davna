import { array, date, object, string } from 'yup'

import type { Entity } from '@davna/core'
import type { Account_URI } from './uri'

import { Account } from './account'

export interface Account_V2Props {
  name: string
  external_ref: string
  roles: string[] // Se trata do ID da Role
}

export interface Account_v2 extends Account_V2Props, Entity<Account_URI> {}

export interface CreateAccount_v2Props
  extends Account_V2Props, Partial<Entity> {}

const v2Schema = object({
  id: string().optional(),
  created_at: date().optional(),
  updated_at: date().optional(),
  __version: string().oneOf(['v2']).optional(),
  name: string().required(),
  external_ref: string().required(),
  roles: array().of(string().required()).required(),
})

export function Account_v2({
  id = '',
  name,
  external_ref,
  roles,
  created_at,
  updated_at,
}: CreateAccount_v2Props): Account_v2 {
  const now = new Date()
  return Account(
    id,
    name,
    external_ref,
    roles,
    created_at ?? now,
    updated_at ?? now,
  )
}

Account_v2.is_v2 = (data: unknown): data is CreateAccount_v2Props =>
  v2Schema.isValidSync(data, { strict: true })
