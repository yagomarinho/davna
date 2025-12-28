/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MongoConverter, MongoRepository } from '@davna/infra'
import { Representation, RepresentationURI } from './representation'
import { createMeta, EntityContext } from '@davna/core'
import { createRepresentation } from './create.representation'

const converter: MongoConverter<Representation> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { source_id, target_id, target_type, type, kind },
  }) => ({
    id,
    data: {
      source_id,
      target_id,
      target_type,
      type,
      kind,
      created_at,
      updated_at,
      _idempotency_key,
      __version: _v,
      __tag: _t,
    },
  }),
  from: ({
    id,
    data: {
      source_id,
      target_id,
      target_type,
      type,
      kind,
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createRepresentation(
      { source_id, target_id, target_type, type, kind },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface RepresentationRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const RepresentationRepository = ({
  client,
  entityContext,
}: RepresentationRepositoryConfig) =>
  MongoRepository<Representation>({
    ...{
      uri:
        process.env.MONGODB_REPRESENTATION_CONNECT_URI ||
        'mongodb://localhost:27017',
      database: process.env.MONGODB_REPRESENTATION_DATABASE || 'db',
      collection:
        process.env.MONGODB_REPRESENTATION_COLLECTION || 'representations',
    },
    client: client as any,
    converter,
    tag: RepresentationURI,
    entityContext,
  })
