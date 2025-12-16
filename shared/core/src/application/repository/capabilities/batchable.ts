import { Resource } from '../../../domain'
import { Repository, RepositoryURI } from '../contracts'

export interface Batchable<
  R extends Repository,
> extends Resource<RepositoryURI> {
  readonly batch: R['methods']['batch']
}
