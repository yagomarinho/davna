import { applyTag, applyVersioning, Entity } from '@davna/core'

const URI = 'session'
type URI = typeof URI

export interface SessionProps {
  account_id: string
  user_agent: string
  refresh_token: string
  expiresIn: Date
}

export interface Session extends SessionProps, Entity<URI, 'v1'> {}

export interface CreateSessionProps extends SessionProps, Partial<Entity> {}

export function Session(
  id: string,
  account_id: string,
  user_agent: string,
  refresh_token: string,
  expiresIn: Date,
  created_at: Date,
  updated_at: Date,
): Session {
  return applyVersioning('v1')(
    applyTag(URI)({
      id,
      account_id,
      user_agent,
      refresh_token,
      expiresIn,
      created_at,
      updated_at,
    }),
  )
}

Session.create = ({
  id = '',
  account_id,
  user_agent,
  refresh_token,
  expiresIn,
  created_at,
  updated_at,
}: CreateSessionProps) => {
  const now = new Date()
  return Session(
    id,
    account_id,
    user_agent,
    refresh_token,
    expiresIn,
    created_at ?? now,
    updated_at ?? now,
  )
}
