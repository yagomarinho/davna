import { Entity } from '../domain'
import { Identifier } from '../identifier'
import { Query } from './query'
import { Tagged } from '../tagged'
import { Batch, WriteBatchResult } from './batch'

export type RepositoryResult<E> = E | Promise<E>

const URI = 'repository'
type URI = typeof URI

export interface Repository<E extends Entity = any> extends Tagged<URI> {
  readonly get: (id: string) => RepositoryResult<E | undefined>
  readonly set: (entity: E) => RepositoryResult<E>
  readonly remove: (e: Identifier) => RepositoryResult<void>
  readonly query: (q?: Query<E>) => RepositoryResult<E[]>
  readonly batch: (b: Batch<E>) => RepositoryResult<WriteBatchResult>
}

export interface Readable<R extends Repository> extends Tagged<URI> {
  readonly get: R['get']
}
export interface Queryable<R extends Repository> extends Tagged<URI> {
  readonly query: R['query']
}

export interface Writable<R extends Repository> extends Tagged<URI> {
  readonly set: R['set']
}

export interface Batchable<R extends Repository> extends Tagged<URI> {
  readonly batch: R['batch']
}

export interface WriteonlyMode<R extends Repository>
  extends Writable<R>, Batchable<R> {}

export interface ReadonlyMode<R extends Repository>
  extends Readable<R>, Queryable<R>, Tagged<URI> {}
