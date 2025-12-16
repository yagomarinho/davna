import { Resource } from '../../../domain'
import { Repository, RepositoryURI } from '../contracts'

export interface Queryable<
  R extends Repository,
> extends Resource<RepositoryURI> {
  readonly query: R['query']
}
