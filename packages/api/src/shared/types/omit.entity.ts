import { Entity } from '../core/entity'

export type OmitEntityProps<E extends Entity> = Omit<
  E,
  'id' | 'created_at' | 'updated_at' | '__tag'
>
