import { Entity } from '../../../../domain'
import { RepositoryResult } from '../types'

export interface RepositorySetter<E extends Entity> {
  (entity: E): RepositoryResult<E>
}
