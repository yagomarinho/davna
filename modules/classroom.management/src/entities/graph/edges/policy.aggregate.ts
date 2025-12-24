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
} from '@davna/core'
import { Edge, EdgeProps } from './edge'
import { MongoConverter, MongoRepository } from '@davna/infra'

export const PolicyAggregateURI = 'policy-aggregate'
export type PolicyAggregateURI = typeof PolicyAggregateURI

export const PolicyAggregateVersion = 'v1'
export type PolicyAggregateVersion = typeof PolicyAggregateVersion

// in policy-aggregate
// entitlement.id is source_id
// usagePolicy.id is target_id
export interface PolicyAggregateProps extends EdgeProps {}

export interface PolicyAggregate extends Edge<
  PolicyAggregateProps,
  PolicyAggregateURI,
  PolicyAggregateVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [PolicyAggregateURI]: PolicyAggregate
  }
}

export function createPolicyAggregate(
  props: PolicyAggregateProps,
): DraftEntity<PolicyAggregate>
export function createPolicyAggregate(
  props: PolicyAggregateProps,
  meta: undefined,
  _version: PolicyAggregateVersion,
): DraftEntity<PolicyAggregate>
export function createPolicyAggregate(
  props: PolicyAggregateProps,
  meta: EntityMeta,
  _version?: PolicyAggregateVersion,
): PolicyAggregate
export function createPolicyAggregate(
  { source_id, target_id }: PolicyAggregateProps,
  meta?: EntityMeta,
  _version: PolicyAggregateVersion = PolicyAggregateVersion,
): DraftEntity<PolicyAggregate> | PolicyAggregate {
  return createEntity(
    PolicyAggregateURI,
    _version,
    createPolicyAggregate,
    { source_id, target_id },
    meta as any,
  )
}

const converter: MongoConverter<PolicyAggregate> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { source_id, target_id },
  }) => ({
    id,
    data: {
      source_id,
      target_id,

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
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createPolicyAggregate(
      { source_id, target_id },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface PolicyAggregateRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const PolicyAggregateRepository = ({
  client,
  entityContext,
}: PolicyAggregateRepositoryConfig) =>
  MongoRepository<PolicyAggregate>({
    ...{
      uri:
        process.env.MONGODB_POLICYAGGREGATE_CONNECT_URI ||
        'mongodb://localhost:27017',
      database: process.env.MONGODB_POLICYAGGREGATE_DATABASE || 'db',
      collection:
        process.env.MONGODB_POLICYAGGREGATE_COLLECTION || 'policy-aggregate',
    },
    client: client as any,
    converter,
    tag: PolicyAggregateURI,
    entityContext,
  })
