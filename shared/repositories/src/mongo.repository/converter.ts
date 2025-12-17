import { DraftEntity, Entity, Identifiable } from '@davna/core'

export interface MongoDocument<P extends {} = any> extends Identifiable {
  data: P
}

export interface MongoConverter<E extends Entity, P extends {} = any> {
  to: (entity: DraftEntity<E>) => MongoDocument<P>
  from: (doc: MongoDocument<P>) => E
}
