/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AuthContext, Handler, isLeft, Response } from '@davna/core'
import { ClassroomFedRepository } from '../../repositories'
import { authorizeConsumption, getParticipantBySubjectId } from '../../services'
import { USAGE_UNITS } from '../../entities'

interface Data {
  usage_unit: USAGE_UNITS
}
interface Metadata {
  auth: AuthContext
}

interface Env {
  repository: ClassroomFedRepository
}

export const checkMaxEstimatedConsumptionHandler = Handler<Env, Data, Metadata>(
  ({ data, metadata }) =>
    async ({ repository }) => {
      const { usage_unit } = data
      const { id: account_id } = metadata.auth.principal.account

      const accountParticipantResult = await getParticipantBySubjectId({
        subject_id: account_id,
      })({ repository })

      if (isLeft(accountParticipantResult))
        return Response({
          metadata: { headers: { status: 401 } },
          data: { message: 'Invalid account id' },
        })

      const participant = accountParticipantResult.value

      const consumptionResult = await authorizeConsumption({
        usage_unit,
        participant_id: participant.meta.id,
      })({
        repository,
      })

      if (isLeft(consumptionResult))
        return Response({
          metadata: { headers: { status: 403 } },
          data: { message: 'Consumption limit exceeded.. Try again later' },
        })

      const consumption = consumptionResult.value

      if (consumption.length === 0)
        return Response({
          metadata: { headers: { status: 500 } },
          data: { message: 'No consumption policies found' },
        })

      const mostRestrictive = consumption.reduce((acc, next) => {
        const actualRemaining =
          acc.policy.maxConsumption - acc.consumption.value

        const nextRemaining =
          next.policy.maxConsumption - next.consumption.value

        return actualRemaining <= nextRemaining ? acc : next
      })

      return Response.data({
        consumption: {
          aggregation: mostRestrictive.policy.aggregation,
          unit: mostRestrictive.policy.unit,
          totalUsed: mostRestrictive.consumption.value,
          maxConsumption: mostRestrictive.policy.maxConsumption,
          remainingConsumption:
            mostRestrictive.policy.maxConsumption -
            mostRestrictive.consumption.value,
        },
      })
    },
)
