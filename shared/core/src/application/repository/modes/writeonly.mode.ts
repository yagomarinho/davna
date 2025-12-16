export interface WriteonlyMode<R extends Repository>
  extends Writable<R>, Batchable<R> {}
