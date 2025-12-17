/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DraftEntity, Entity, ExtractEntityTag } from '@davna/core'
import { Converter } from '@davna/types'

import { MongoClient } from 'mongodb'
import { ProjectionFields } from './projection.fields'

export interface MongoConfigBaseProps<E extends Entity> {
  database: string
  collection: string
  converter: Converter<DraftEntity<E>>
  projection?: ProjectionFields<E>
  tag: ExtractEntityTag<E>
}

export interface MongoClientConfig<
  E extends Entity,
> extends MongoConfigBaseProps<E> {
  client: MongoClient
}

export interface MongoWithURIConfig<
  E extends Entity,
> extends MongoConfigBaseProps<E> {
  uri: string
}
