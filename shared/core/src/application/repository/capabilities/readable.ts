export interface Readable<
  R extends Repository,
> extends Resource<RepositoryURI> {
  readonly get: R['get']
}
