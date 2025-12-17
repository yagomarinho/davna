/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, Identifiable } from '@davna/core'

/**
 * Represents a raw MongoDB document with typed data.
 *
 * - P: the shape of the stored data
 *
 * The document includes an `id` for identification
 * and a `data` field holding the entity properties.
 */

export interface MongoDocument<P extends {} = any> extends Identifiable {
  data: P
}

/**
 * Converter between domain entities and MongoDB documents.
 *
 * Provides functions to:
 * - serialize a DraftEntity into a MongoDocument for storage
 * - deserialize a MongoDocument back into a full Entity
 *
 * - E: the domain entity type
 * - P: the shape of the MongoDB document data
 */

export interface MongoConverter<E extends Entity, P extends {} = any> {
  to: (entity: E) => MongoDocument<P>
  from: (doc: MongoDocument<P>) => E
}
