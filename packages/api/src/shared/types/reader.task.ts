export interface ReaderTask<E, A> {
  (env: E): Promise<A>
}
