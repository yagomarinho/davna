import { isLeft, isRight } from '@davna/core'
import { IDContext } from '@davna/infra'

import { authorizeConsumption } from '../authorize.consumption'

import {
  AGGREGATION_POLICY,
  AudioURI,
  COUNT_UNITS,
  createEntitlement,
  createGranted,
  createParticipant,
  createPolicyAggregate,
  createUsage,
  createUsagePolicy,
  USAGE_STATUS,
} from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from '../../__fakes__/classroom.fed.fake'
import { IDContextFake } from '../../__fakes__/id.context.fake'

describe('authorize consumption service', () => {
  let repository: ClassroomFedRepository
  let IDContext: IDContext

  beforeEach(async () => {
    IDContext = IDContextFake()
    repository = ClassroomFedFake({ IDContext })

    jest.clearAllMocks()
  })

  it('should be able to authorize consumption when participant has available daily usage', async () => {
    const owner_id = 'owner'
    const requested_consumption = 10

    const participant = await repository.methods.set(
      createParticipant({ subject_id: owner_id, type: 'costumer' }),
    )

    const entitlement = await repository.methods.set(createEntitlement({}))

    await repository.methods.set(
      createGranted({
        source_id: participant.meta.id,
        target_id: entitlement.meta.id,
        expires_at: new Date(Date.now() + 60_000),
        priority: 10,
      }),
    )

    const policy = await repository.methods.set(
      createUsagePolicy({
        aggregation: AGGREGATION_POLICY.PER_DAY,
        maxConsumption: 100,
        unit: COUNT_UNITS.TKS,
      }),
    )

    await repository.methods.set(
      createPolicyAggregate({
        source_id: entitlement.meta.id,
        target_id: policy.meta.id,
      }),
    )

    await repository.methods.set(
      createUsage({
        status: USAGE_STATUS.CONFIRMED,
        source_id: participant.meta.id,
        target_id: 'audio-1',
        target_type: AudioURI,
        consumption: {
          unit: COUNT_UNITS.TKS,
          value: 25,
          raw_value: 25,
          normalization_factor: 1,
          precision: 0,
        },
        metadata: {},
      }),
    )

    const result = await authorizeConsumption({
      participant_id: participant.meta.id,
      requested_consumption,
      usage_unit: COUNT_UNITS.TKS,
    })({ repository })

    expect(isRight(result)).toBeTruthy()

    const value = (result as any).value

    expect(value).toEqual([
      expect.objectContaining({
        policy: expect.objectContaining({
          aggregation: AGGREGATION_POLICY.PER_DAY,
          maxConsumption: 100,
          unit: COUNT_UNITS.TKS,
        }),
        consumption: { value: 25, estimatedAfterRequest: 35 },
      }),
    ])
  })

  it('should not be able to authorize consumption when requested consumption exceeds policy limit', async () => {
    const owner_id = 'owner'

    const participant = await repository.methods.set(
      createParticipant({ subject_id: owner_id, type: 'costumer' }),
    )

    const entitlement = await repository.methods.set(createEntitlement({}))

    await repository.methods.set(
      createGranted({
        source_id: participant.meta.id,
        target_id: entitlement.meta.id,
        expires_at: new Date(Date.now() + 60_000),
        priority: 1,
      }),
    )

    const policy = await repository.methods.set(
      createUsagePolicy({
        aggregation: AGGREGATION_POLICY.PER_DAY,
        maxConsumption: 30,
        unit: COUNT_UNITS.TKS,
      }),
    )

    await repository.methods.set(
      createPolicyAggregate({
        source_id: entitlement.meta.id,
        target_id: policy.meta.id,
      }),
    )

    await repository.methods.set(
      createUsage({
        status: USAGE_STATUS.CONFIRMED,
        source_id: participant.meta.id,
        target_id: 'audio-1',
        target_type: AudioURI,
        consumption: {
          unit: COUNT_UNITS.TKS,
          value: 25,
          raw_value: 25,
          normalization_factor: 1,
          precision: 0,
        },
        metadata: {},
      }),
    )

    const result = await authorizeConsumption({
      participant_id: participant.meta.id,
      requested_consumption: 10,
      usage_unit: COUNT_UNITS.TKS,
    })({ repository })

    expect(isLeft(result)).toBeTruthy()
  })

  it('should not be able to authorize consumption when participant has no active policies', async () => {
    const owner_id = 'owner'

    const participant = await repository.methods.set(
      createParticipant({ subject_id: owner_id, type: 'costumer' }),
    )

    const entitlement = await repository.methods.set(createEntitlement({}))

    await repository.methods.set(
      createGranted({
        source_id: participant.meta.id,
        target_id: entitlement.meta.id,
        expires_at: new Date(Date.now() + 60_000),
        priority: 1,
      }),
    )

    const result = await authorizeConsumption({
      participant_id: participant.meta.id,
      requested_consumption: 1,
      usage_unit: COUNT_UNITS.TKS,
    })({ repository })

    expect(isLeft(result)).toBeTruthy()
  })

  it('should not be able to authorize consumption when participant does not exist', async () => {
    const result = await authorizeConsumption({
      participant_id: 'invalid-participant',
      requested_consumption: 5,
      usage_unit: COUNT_UNITS.TKS,
    })({ repository })

    expect(isLeft(result)).toBeTruthy()
  })
})
