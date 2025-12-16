import { Identifier } from '../identifier'

export type Batch<E> = (UpsertBatchItem<E> | RemoveBatchItem)[]
