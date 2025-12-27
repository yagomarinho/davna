import { isLeft, isRight } from '@davna/core'

import { ensureOwnershipToTargetResource } from '../ensure.ownership.to.target.resource'
import {
  ClassroomURI,
  createClassroom,
  createOwnership,
} from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from '../../__fakes__/classroom.fed.fake'
import { IDContext } from '@davna/infra'
import { IDContextFake } from '../../__fakes__/id.context.fake'

describe('ensure ownership to target resource service', () => {
  let repository: ClassroomFedRepository
  let IDContext: IDContext

  beforeEach(() => {
    IDContext = IDContextFake()
    repository = ClassroomFedFake({ IDContext })
  })

  it('should return Right with ownership when owner has ownership over target resource', async () => {
    const owner_id = 'owner-1'

    const classroom = await repository.methods.set(
      createClassroom({ name: 'Any classroom' }),
    )

    const ownership = await repository.methods.set(
      createOwnership({
        source_id: owner_id,
        target_id: classroom.meta.id,
        target_type: ClassroomURI,
      }),
    )

    const result = await ensureOwnershipToTargetResource({
      owner_id,
      target: classroom,
    })({ repository })

    expect(isRight(result)).toBeTruthy()
    expect((result as any).value).toEqual(ownership)
  })

  it('should return Left when owner has no ownership over target resource', async () => {
    const owner_id = 'owner-1'

    const classroom = await repository.methods.set(
      createClassroom({ name: 'Any classroom' }),
    )

    const result = await ensureOwnershipToTargetResource({
      owner_id,
      target: classroom,
    })({ repository })

    expect(isLeft(result)).toBeTruthy()
    expect((result as any).value).toEqual({
      status: 'error',
      message: `This owner with id ${owner_id} has no authorization to handle this resource ${ClassroomURI} with id ${classroom.meta.id}`,
    })
  })

  it('should not return ownership from another owner for the same target', async () => {
    const classroom = await repository.methods.set(
      createClassroom({ name: 'Any classroom' }),
    )

    await repository.methods.set(
      createOwnership({
        source_id: 'another-owner',
        target_id: classroom.meta.id,
        target_type: ClassroomURI,
      }),
    )

    const result = await ensureOwnershipToTargetResource({
      owner_id: 'owner-1',
      target: classroom,
    })({ repository })

    expect(isLeft(result)).toBeTruthy()
  })

  it('should not return ownership when target type does not match', async () => {
    const owner_id = 'owner-1'

    const classroom = await repository.methods.set(
      createClassroom({ name: 'Any classroom' }),
    )

    await repository.methods.set(
      createOwnership({
        source_id: owner_id,
        target_id: classroom.meta.id,
        target_type: 'audio' as any,
      }),
    )

    const result = await ensureOwnershipToTargetResource({
      owner_id,
      target: classroom,
    })({ repository })

    expect(isLeft(result)).toBeTruthy()
  })
})
