export interface Writable<
  R extends Repository,
> extends Resource<RepositoryURI> {
  readonly set: R['set']
}
