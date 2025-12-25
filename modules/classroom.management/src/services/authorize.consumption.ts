/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Filter,
  isLeft,
  isRight,
  Left,
  QueryBuilder,
  Right,
  Service,
} from '@davna/core'

import { ClassroomFedRepository } from '../repositories'
import {
  AGGREGATION_POLICY,
  EntitlementURI,
  Granted,
  GrantedURI,
  ParticipantURI,
  PolicyAggregateURI,
  Usage,
  UsagePolicyProps,
  UsagePolicyURI,
  UsageURI,
} from '../entities'

interface Data {
  owner_id: string
  requested_consumption: number
}

interface Env {
  repository: ClassroomFedRepository
}

interface Response {
  policy: UsagePolicyProps
  consumption: {
    value: number
  }
}

export const authorizeConsumption = Service<Data, Env, Response[]>(
  ({ owner_id, requested_consumption }) =>
    async ({ repository }) => {
      const {
        data: [participant],
      } = await repository.methods.query(
        QueryBuilder().filterBy('subject_id', '==', owner_id).build(),
        ParticipantURI,
      )

      if (!participant)
        return Left({
          status: 'error',
          message: `No founded participant related with subject_id: ${owner_id}`,
        })

      const {
        data: [granted],
      } = await repository.methods.query(
        QueryBuilder<Granted>()
          .orderBy([{ property: 'priority', direction: 'desc' }])
          .filterBy(
            Filter.and(
              Filter.where('source_id', '==', participant.meta.id),
              Filter.where('expires_at', '>', new Date()),
            ),
          )
          .build(),
        GrantedURI,
      )

      if (!granted)
        return Left({
          status: 'error',
          message: `Participant has no active entitlement for conversation usage`,
        })

      const entitlement = await repository.methods.get(granted.props.target_id)

      if (!entitlement || entitlement._t !== EntitlementURI)
        return Left({
          status: 'error',
          message: `Participant has no active entitlement for conversation usage`,
        })

      const { data: entitlementPolicies } = await repository.methods.query(
        QueryBuilder().filterBy('source_id', '==', entitlement.meta.id).build(),
        PolicyAggregateURI,
      )

      const { data: policies } = entitlementPolicies.length
        ? await repository.methods.query(
            QueryBuilder()
              .filterBy(
                'id',
                'in',
                entitlementPolicies.map(p => p.props.target_id),
              )
              .build(),
            UsagePolicyURI,
          )
        : { data: [] }

      if (!policies.length)
        return Left({
          status: 'error',
          message: `Participant has no active policies for conversation usage`,
        })

      const appliedPolicies = await Promise.all(
        policies.map(async policy => {
          const aggregation = {
            [AGGREGATION_POLICY.PER_DAY]: today,
            [AGGREGATION_POLICY.PER_WEEK]: week,
            [AGGREGATION_POLICY.PER_MONTH]: month,
          }

          const { data: usages } = await repository.methods.query(
            QueryBuilder<Usage>()
              .filterBy(
                'created_at',
                '>=',
                aggregation[policy.props.aggregation](),
              )
              .build(),
            UsageURI,
          )

          const { consumption } = usages.reduce(
            (acc, usage) => ({
              consumption:
                acc.consumption +
                (usage.props.consumption.props.unit === policy.props.unit
                  ? usage.props.consumption.props.value
                  : 0),
            }),
            { consumption: 0 },
          )

          if (
            consumption + requested_consumption >=
            policy.props.maxConsumption
          )
            return Left()

          return Right({
            policy: {
              aggregation: policy.props.aggregation,
              maxConsumption: policy.props.maxConsumption,
              unit: policy.props.unit,
            },
            consumption: {
              value: consumption,
            },
          })
        }),
      )

      if (!appliedPolicies.every(e => isRight(e)))
        return Left({
          status: 'error',
          message: 'Has no consumption left. Try again later',
          data: appliedPolicies
            .filter(applied => isLeft(applied))
            .map(left => left.value),
        })

      return Right(appliedPolicies.map(applied => applied.value))
    },
)

const days = 24 * 60 * 60 * 1000

function today() {
  return new Date(new Date().toDateString())
}

function week() {
  return new Date(new Date(Date.now() - 7 * days).toDateString())
}

function month() {
  return new Date(new Date(Date.now() - 30 * days).toDateString())
}
