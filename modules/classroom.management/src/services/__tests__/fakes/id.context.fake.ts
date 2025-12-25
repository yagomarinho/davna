import { createMeta, EntityContext, isEntity } from '@davna/core'
import { IDContext, InMemoryRepository } from '@davna/infra'
import { createID, ID, IDURI } from '@davna/kernel'

export function IDContextFake(): IDContext {
  const ids = InMemoryRepository<ID>({ tag: IDURI })
  let _key: string | undefined = undefined

  const setIdempotency: EntityContext['setIdempotency'] = key => {
    _key = key
  }

  const validateEntity: EntityContext['validateEntity'] = entity =>
    isEntity(entity)

  const _createMeta: EntityContext['createMeta'] = async ({
    id,
    created_at,
    updated_at,
    _idempotency_key,
  } = {}) => {
    const now = new Date()

    return createMeta({
      id: id ?? '',
      created_at: created_at ?? now,
      updated_at: updated_at ?? now,
      _idempotency_key: _key ?? _idempotency_key ?? '',
    })
  }

  const declareEntity: EntityContext['declareEntity'] = async entity => {
    const isValidEntity = validateEntity(entity)
    let IDEntity = isValidEntity ? await getIDEntity(entity.meta.id) : undefined

    if (!IDEntity)
      IDEntity = await ids.methods.set(
        createID({ entity_tag: getEntityTag(entity) }),
      )

    const meta = await _createMeta({
      id: IDEntity.meta.id,
      created_at: IDEntity.meta.created_at,
      updated_at: IDEntity.meta.updated_at,
    })

    return entity._b(entity.props, meta) as any
  }

  const getEntityTag: IDContext['getEntityTag'] = entity => entity._t

  const getIDEntity: IDContext['getIDEntity'] = id => ids.methods.get(id)

  return {
    setIdempotency,
    declareEntity,
    createMeta: _createMeta,
    validateEntity,
    getEntityTag,
    getIDEntity,
  }
}
