import { Entity } from '../../../../domain'
import { RepositoryResult } from '../types'

export interface RepositoryGetter<E extends Entity> {
  (id: string): RepositoryResult<E | undefined>
}
