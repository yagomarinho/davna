import { applyTag, applyVersioning, Entity } from '@davna/core'

const URI = 'role'
type URI = typeof URI

export interface RoleProps {
  name: string
  description: string
}

export interface Role extends RoleProps, Entity<URI, 'v1'> {}

export interface CreateRoleProps extends RoleProps, Partial<Entity> {}

export function Role(
  id: string,
  name: string,
  description: string,
  created_at: Date,
  updated_at: Date,
): Role {
  return applyVersioning('v1')(
    applyTag(URI)({
      id,
      name,
      description,
      created_at,
      updated_at,
    }),
  )
}

Role.create = ({
  id = '',
  name,
  description,
  created_at,
  updated_at,
}: CreateRoleProps) => {
  const now = new Date()
  return Role(id, name, description, created_at ?? now, updated_at ?? now)
}
