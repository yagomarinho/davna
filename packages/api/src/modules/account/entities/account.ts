import { Entity } from '../../../shared/core/entity'
import { applyTag } from '../../../shared/core/tagged'

export const URI = 'account'
export type URI = typeof URI

export interface AccountProps {
  name: string
  external_ref: string
}

export interface Account extends AccountProps, Entity<URI> {}

export interface CreateAccountProps extends AccountProps, Partial<Entity> {}

export function Account(
  id: string,

  name: string,
  external_ref: string,
  created_at: Date,
  updated_at: Date,
): Account {
  return applyTag(URI)({
    id,
    name,
    external_ref,
    created_at,
    updated_at,
  })
}

Account.create = ({
  id = '',
  name,
  external_ref,
  created_at,
  updated_at,
}: CreateAccountProps) => {
  const now = new Date()
  return Account(id, name, external_ref, created_at ?? now, updated_at ?? now)
}
