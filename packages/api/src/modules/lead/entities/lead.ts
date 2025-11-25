import { Entity } from '../../../shared/core/entity'
import { applyTag } from '../../../shared/core/tagged'

export const URI = 'lead'
export type URI = typeof URI

export type Lead = Entity<URI>

export interface CreateLead extends Partial<Entity> {
  id: string
}

export function Lead(id: string, created_at: Date, updated_at: Date): Lead {
  return applyTag('lead')({
    id,
    created_at,
    updated_at,
  })
}

Lead.create = ({ id, created_at, updated_at }: CreateLead) => {
  const now = new Date()
  return Lead(id, created_at ?? now, updated_at ?? now)
}
