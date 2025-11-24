import { Identifier } from '../entity'

export interface UpsertBatchItem<E> {
  type: 'upsert'
  data: E
}

export interface RemoveBatchItem {
  type: 'remove'
  data: Identifier
}

export type Batch<E> = (UpsertBatchItem<E> | RemoveBatchItem)[]

export interface WriteBatchResult {
  status: 'successful' | 'failed'
  time: Date
}
