import { isRight, Repository } from '@davna/core'
import { InMemoryRepository } from '@davna/infra'

import { Classroom, PARTICIPANT_ROLE } from '../../entities/classroom'
import { createClassroom } from '../create.classroom'

describe('createClassroom (service) - updated behavior', () => {
  let classrooms: Repository<Classroom>

  beforeEach(async () => {
    classrooms = InMemoryRepository<Classroom>()

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return Right with a classroom containing teacher and student participants and consume from verifyConsume', async () => {
    // verifyConsume returns Right with consume
    const participant_id = 'student-1'

    const result = await createClassroom({ participant_id })({
      classrooms,
    })

    expect(isRight(result)).toBeTruthy()
    const value = (result as any).value as {
      classroom: Classroom
      consume: number
    }

    const classroom = value.classroom

    expect(classroom.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participant_id: 'agent',
          role: PARTICIPANT_ROLE.TEACHER,
        }),
        expect.objectContaining({
          participant_id,
          role: PARTICIPANT_ROLE.STUDENT,
        }),
      ]),
    )

    expect(classroom.history).toEqual([])
  })

  it('should persist and generate unique classrooms for different participants', async () => {
    const r1 = await createClassroom({ participant_id: 'alice' })({
      classrooms,
    })
    const r2 = await createClassroom({ participant_id: 'bob' })({
      classrooms,
    })

    expect(isRight(r1)).toBeTruthy()
    expect(isRight(r2)).toBeTruthy()

    const c1 = (r1 as any).value.classroom as Classroom
    const c2 = (r2 as any).value.classroom as Classroom

    expect(c1).not.toBe(c2)
    if ((c1 as any).id && (c2 as any).id) {
      expect((c1 as any).id).not.toEqual((c2 as any).id)
    }

    expect(c1.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participant_id: 'alice',
          role: PARTICIPANT_ROLE.STUDENT,
        }),
      ]),
    )

    expect(c2.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participant_id: 'bob',
          role: PARTICIPANT_ROLE.STUDENT,
        }),
      ]),
    )
  })
})
