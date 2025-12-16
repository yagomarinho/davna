import { Entity } from '../../../../domain'
import { Query } from '../../query'
import { RepositoryResult } from '../types'

export interface RepositorySearcher<E extends Entity> {
  (q?: Query<E>): RepositoryResult<E[]>
}
