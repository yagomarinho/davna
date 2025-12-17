/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, ExtractEntityTag } from '@davna/core'

import { MongoClient } from 'mongodb'
import { ProjectionFields } from './projection.fields'
import { MongoConverter } from './converter'

/**
 * Base configuration for a MongoDB repository.
 *
 * Contains shared properties required to connect to a collection
 * and manage entities.
 *
 * - E: the entity type handled by the repository
 */

export interface MongoConfigBaseProps<E extends Entity> {
  /** Name of the MongoDB database */
  database: string

  /** Name of the collection within the database */
  collection: string

  /** Converter to transform between entities and MongoDB documents */
  converter: MongoConverter<E>

  /** Optional projection fields to limit query results */
  projection?: ProjectionFields<E>

  /** Tag identifying the kind of entity stored */
  tag: ExtractEntityTag<E>
}

/**
 * MongoDB repository configuration using an existing MongoClient.
 *
 * Extends the base configuration and provides a pre-initialized client.
 */

export interface MongoClientConfig<
  E extends Entity,
> extends MongoConfigBaseProps<E> {
  /** Pre-existing MongoClient instance */
  client: MongoClient
}

/**
 * MongoDB repository configuration using a URI.
 *
 * Extends the base configuration and allows the repository
 * to create its own MongoClient from the connection URI.
 */

export interface MongoWithURIConfig<
  E extends Entity,
> extends MongoConfigBaseProps<E> {
  /** MongoDB connection URI */
  uri: string
}
