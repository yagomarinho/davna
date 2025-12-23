/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  createEntity,
  createMeta,
  DraftEntity,
  EntityContext,
  EntityMeta,
  RawProps,
  ValueObject,
} from '@davna/core'
import { AudioURI, TextURI, USAGE_UNITS } from '../vertices'
import { Edge, EdgeProps } from './edge'
import { MongoConverter, MongoRepository } from '@davna/infra'

export const UsageURI = 'usage'
export type UsageURI = typeof UsageURI

export const ConsumptionURI = 'usage.consumption'
export type ConsumptionURI = typeof ConsumptionURI

export const UsageVersion = 'v1'
export type UsageVersion = typeof UsageVersion

export interface Consumption {
  unit: USAGE_UNITS
  value: number
  raw_value: number
  normalization_factor: number
  precision: number // digitos após a vírgula
}

// in usage
// participant.id is source_id
// resource.id is target_id
export interface UsageProps extends EdgeProps {
  target_type: AudioURI | TextURI
  consumption: ValueObject<Consumption>
}

export interface Usage extends Edge<UsageProps, UsageURI, UsageVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [UsageURI]: Usage
  }
}

export function createUsage(props: RawProps<UsageProps>): DraftEntity<Usage>
export function createUsage(
  props: RawProps<UsageProps>,
  meta: undefined,
  _version: UsageVersion,
): DraftEntity<Usage>
export function createUsage(
  props: RawProps<UsageProps>,
  meta: EntityMeta,
  _version?: UsageVersion,
): Usage
export function createUsage(
  { source_id, target_id, target_type, consumption }: RawProps<UsageProps>,
  meta?: EntityMeta,
  _version: UsageVersion = UsageVersion,
): DraftEntity<Usage> | Usage {
  return _createUsage(
    {
      source_id,
      target_id,
      target_type,
      consumption: _createUsageConsumption(
        consumption,
        meta?._idempotency_key ?? '',
      ),
    },
    meta as any,
    _version,
  )
}

export function _createUsage(props: UsageProps): DraftEntity<Usage>
export function _createUsage(
  props: UsageProps,
  meta: undefined,
  _version: UsageVersion,
): DraftEntity<Usage>
export function _createUsage(
  props: UsageProps,
  meta: EntityMeta,
  _version?: UsageVersion,
): Usage
export function _createUsage(
  { source_id, target_id, target_type, consumption }: UsageProps,
  meta?: EntityMeta,
  _version: UsageVersion = UsageVersion,
): DraftEntity<Usage> | Usage {
  return createEntity(
    UsageURI,
    _version,
    _createUsage,
    { source_id, target_id, target_type, consumption },
    meta as any,
  )
}

export function _createUsageConsumption(
  props: Consumption,
  _idempotency_key: string,
): ValueObject<Consumption, ConsumptionURI> {
  return ValueObject(props, _idempotency_key, ConsumptionURI)
}

const converter: MongoConverter<Usage> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { source_id, target_id, target_type, consumption },
  }) => ({
    id,
    data: {
      source_id,
      target_id,
      target_type,
      consumption,
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
      consumption,
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createUsage(
      {
        source_id,
        target_id,
        target_type,
        consumption,
      },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface UsageRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const UsageRepository = ({
  client,
  entityContext,
}: UsageRepositoryConfig) =>
  MongoRepository<Usage>({
    ...{
      uri: process.env.MONGODB_USAGE_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_USAGE_DATABASE || 'db',
      collection: process.env.MONGODB_USAGE_COLLECTION || 'usages',
    },
    client: client as any,
    converter,
    tag: UsageURI,
    entityContext,
  })
