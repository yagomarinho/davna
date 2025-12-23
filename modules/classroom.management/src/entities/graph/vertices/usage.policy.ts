import {
  createEntity,
  createMeta,
  DraftEntity,
  Entity,
  EntityContext,
  EntityMeta,
} from '@davna/core'
import { MongoConverter, MongoRepository } from '@davna/infra'

export const UsagePolicyURI = 'usage-policy'
export type UsagePolicyURI = typeof UsagePolicyURI

export const UsagePolicyVersion = 'v1'
export type UsagePolicyVersion = typeof UsagePolicyVersion

export enum AGGREGATION_POLICY {
  PER_DAY = 'per_day',
  PER_WEEK = 'per_week',
  PER_MONTH = 'per_month',
}

export enum USAGE_UNITS {
  SECONDS = 'seconds',
  TOKENS = 'tokens',
}

export interface UsagePolicyProps {
  unit: USAGE_UNITS
  maxConsumption: number
  aggregation: AGGREGATION_POLICY
}

export interface UsagePolicy extends Entity<
  UsagePolicyProps,
  UsagePolicyURI,
  UsagePolicyVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [UsagePolicyURI]: UsagePolicy
  }
}

export function createUsagePolicy(
  props: UsagePolicyProps,
): DraftEntity<UsagePolicy>
export function createUsagePolicy(
  props: UsagePolicyProps,
  meta: undefined,
  _version: UsagePolicyVersion,
): DraftEntity<UsagePolicy>
export function createUsagePolicy(
  props: UsagePolicyProps,
  meta?: EntityMeta,
  _version?: UsagePolicyVersion,
): UsagePolicy
export function createUsagePolicy(
  { aggregation, maxConsumption, unit }: UsagePolicyProps,
  meta?: EntityMeta,
  _version: UsagePolicyVersion = UsagePolicyVersion,
): UsagePolicy {
  return createEntity(
    UsagePolicyURI,
    _version,
    createUsagePolicy,
    { aggregation, maxConsumption, unit },
    meta as any,
  )
}

const converter: MongoConverter<UsagePolicy> = {
  to: ({
    _v,
    _t,
    meta: { id, created_at, updated_at, _idempotency_key },
    props: { aggregation, maxConsumption, unit },
  }) => ({
    id,
    data: {
      aggregation,
      maxConsumption,
      unit,
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
      aggregation,
      maxConsumption,
      unit,
      created_at,
      updated_at,
      _idempotency_key,
      __version,
    },
  }) =>
    createUsagePolicy(
      { aggregation, maxConsumption, unit },
      createMeta({ id, created_at, updated_at, _idempotency_key }),
      __version,
    ),
}

export interface UsagePolicyRepositoryConfig {
  client?: ReturnType<MongoRepository<any>['infra']['createClient']>
  entityContext: EntityContext
}

export const UsagePolicyRepository = ({
  client,
  entityContext,
}: UsagePolicyRepositoryConfig) =>
  MongoRepository<UsagePolicy>({
    ...{
      uri:
        process.env.MONGODB_USAGEPOLICY_CONNECT_URI ||
        'mongodb://localhost:27017',
      database: process.env.MONGODB_USAGEPOLICY_DATABASE || 'db',
      collection: process.env.MONGODB_USAGEPOLICY_COLLECTION || 'usage-policy',
    },
    client: client as any,
    converter,
    tag: UsagePolicyURI,
    entityContext,
  })
