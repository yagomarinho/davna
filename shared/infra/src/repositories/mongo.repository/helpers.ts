/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Document, MongoClient, ObjectId } from 'mongodb'
import { MongoDocument } from './converter'

/**
 * Converts a MongoDB Document into a MongoDocument.
 *
 * Extracts the `_id` field and stores it as `id` (string),
 * preserving the rest of the document data under `data`.
 */

export function fromDocument({ _id, ...data }: Document): MongoDocument {
  return {
    id: _id.toString(),
    data,
  }
}

/**
 * Converts a MongoDocument into a MongoDB Document.
 *
 * Transforms the `id` string into a MongoDB ObjectId
 * and spreads the entity data into the document fields.
 */

export function toDocument({ id, data }: MongoDocument): Document {
  return {
    _id: mongoId(id),
    ...data,
  }
}

/**
 * Creates a MongoDB ObjectId from a string.
 *
 * Useful for converting entity IDs into MongoDB-compatible IDs.
 */

export function mongoId(id?: string) {
  return id ? new ObjectId(id) : new ObjectId()
}

/**
 * Checks if a MongoClient is connected to the database.
 *
 * Returns `true` if the client exists and can successfully
 * ping the admin database; otherwise returns `false`.
 */

export async function isConnected(client?: MongoClient) {
  if (!client || !client.db()) {
    return false
  }
  try {
    const res = await client.db().admin().ping()
    return res.ok === 1
  } catch {
    return false
  }
}
