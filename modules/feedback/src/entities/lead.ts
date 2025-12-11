import { applyTag, applyVersioning, Entity } from '@davna/core'

const URI = 'lead'
type URI = typeof URI

export interface CreateLead extends Partial<Entity> {
  id: string
}

export interface Lead extends Entity<URI, 'v1'> {}

export function Lead(id: string, created_at: Date, updated_at: Date): Lead {
  return applyVersioning('v1')(
    applyTag(URI)({
      id,
      created_at,
      updated_at,
    }),
  )
}

Lead.create = ({ id, created_at, updated_at }: CreateLead) => {
  const now = new Date()
  return Lead(id, created_at ?? now, updated_at ?? now)
}
