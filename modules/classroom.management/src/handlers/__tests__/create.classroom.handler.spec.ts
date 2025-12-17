import { Left, Repository, Right } from '@davna/core'
import { InMemoryRepository } from '@davna/infra'

import { createClassroomHandler } from '../create.classroom.handler'
import { Classroom } from '../../entities'

import { createClassroom as createClassroomService } from '../../services/create.classroom'

jest.mock('../../services/create.classroom', () => ({
  createClassroom: jest.fn(),
}))

const createClassroom = createClassroomService as any as jest.Mock

describe('createClassroomHandler', () => {
  const accountId = 'acc-1'

  let classrooms: Repository<Classroom>

  beforeEach(() => {
    classrooms = InMemoryRepository<Classroom>()
    jest.clearAllMocks()
  })

  function makeReq() {
    return {
      data: {},
      metadata: {
        account: { id: accountId },
      },
    } as any
  }

  it('should return error metadata when createClassroom returns Left', async () => {
    const req = makeReq()

    createClassroom.mockImplementationOnce(
      () => async () => Left({ message: 'fail' }),
    )

    const result = await createClassroomHandler(req)({
      classrooms,
    })

    expect(createClassroom).toHaveBeenCalledTimes(1)

    const calls = createClassroom.mock.calls[0][0]
    expect(calls).toEqual(
      expect.objectContaining({
        participant_id: accountId,
      }),
    )

    expect(result).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ status: 'error' }),
      }),
    )
  })

  it('should return classroom data when createClassroom succeeds', async () => {
    const req = makeReq()

    const classroom: Classroom = {
      id: 'class-1',
      participants: [],
      history: [],
    } as any

    createClassroom.mockImplementationOnce(
      () => async () => Right({ classroom }),
    )

    const result = await createClassroomHandler(req)({
      classrooms,
    })

    expect(createClassroom).toHaveBeenCalledTimes(1)

    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ classroom }),
      }),
    )
  })
})
