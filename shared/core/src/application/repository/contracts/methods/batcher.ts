import { Entity } from '../../../../domain'
import { Batch, BatchResult } from '../../batch'
import { RepositoryResult } from '../types'

export interface RepositoryBatcher<E extends Entity> {
  (b: Batch<E>): RepositoryResult<BatchResult>
}
