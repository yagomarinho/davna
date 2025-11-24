export interface Reader<E, A> {
  (env: E): A
}
