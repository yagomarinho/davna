import { Entity } from '../domain'
import { applyTag } from '../tagged'
import { applyVersioning } from '../versionable'

export interface IDProps {
  entity_tag: string
}

export interface ID extends IDProps, Entity<'id'> {}

export interface CreateID extends IDProps, Partial<Entity> {}

export function ID(
  id: string,
  entity_tag: string,
  created_at: Date,
  updated_at: Date,
): ID {
  return applyVersioning('v1')(
    applyTag('id')({ id, entity_tag, created_at, updated_at }),
  )
}

ID.create = function createID({
  id = '',
  entity_tag,
  created_at,
  updated_at,
}: CreateID) {
  const now = new Date()
  return ID(id, entity_tag, created_at ?? now, updated_at ?? now)
}

ID.fromEntity = function IDfromEntity(entity: Entity) {
  return ID.create({
    id: entity.id,
    entity_tag: entity.__tag,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  })
}
