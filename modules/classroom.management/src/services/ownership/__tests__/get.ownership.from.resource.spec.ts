import { isLeft, isRight } from '@davna/core'

import { getOwnershipFromResource } from '../get.ownership.from.resource'
import {
  ClassroomURI,
  createClassroom,
  createOwnership,
} from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from '../../__fakes__/classroom.fed.fake'
import { IDContext } from '@davna/infra'
import { IDContextFake } from '../../__fakes__/id.context.fake'

describe('get ownership from resource service', () => {
  let repository: ClassroomFedRepository
  let IDContext: IDContext

  beforeEach(() => {
    IDContext = IDContextFake()
    repository = ClassroomFedFake({ IDContext })
  })

  it('should return Right with ownership when resource has ownership', async () => {
    const classroom = await repository.methods.set(
      createClassroom({ name: 'Any classroom' }),
    )

    const ownership = await repository.methods.set(
      createOwnership({
        source_id: 'owner-1',
        target_id: classroom.meta.id,
        target_type: ClassroomURI,
      }),
    )

    const result = await getOwnershipFromResource({
      target: classroom,
    })({ repository })

    expect(isRight(result)).toBeTruthy()
    expect((result as any).value).toEqual(ownership)
  })

  it('should return Left when ownership is not found for resource', async () => {
    const classroom = await repository.methods.set(
      createClassroom({ name: 'Any classroom' }),
    )

    const result = await getOwnershipFromResource({
      target: classroom,
    })({ repository })

    expect(isLeft(result)).toBeTruthy()
    expect((result as any).value).toEqual({
      status: 'error',
      message: `Ownership now found from resource ${ClassroomURI} with id: ${classroom.meta.id}`,
    })
  })

  it('should not return ownership from another resource with same id but different type', async () => {
    const classroom = await repository.methods.set(
      createClassroom({ name: 'Classroom' }),
    )

    // ownership "enganosa" com mesmo id, mas outro tipo
    await repository.methods.set(
      createOwnership({
        source_id: 'owner-1',
        target_id: classroom.meta.id,
        target_type: 'audio' as any,
      }),
    )

    const result = await getOwnershipFromResource({
      target: classroom,
    })({ repository })

    expect(isLeft(result)).toBeTruthy()
  })
})
