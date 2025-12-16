import { RepositoryResult } from '../types'

export interface RepositoryRemover {
  (id: string): RepositoryResult<void>
}
