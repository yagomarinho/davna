import { EntityContext, isEntity } from '@davna/core'

export function createEntityContext(): EntityContext {
  let n = 0

  const isValid: EntityContext['isValid'] = entity => isEntity(entity)

  const meta: EntityContext['meta'] = () => {
    const now = new Date()
    return {
      _r: 'entity',
      created_at: now,
      updated_at: now,
      id: (n++).toString(),
    }
  }

  return {
    isValid,
    meta,
  }
}
