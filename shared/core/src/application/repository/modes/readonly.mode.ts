export interface ReadonlyMode<R extends Repository>
  extends Readable<R>, Queryable<R>, Resource<RepositoryURI> {}
