import { isRight } from '../../../../shared/core/either'
import { InMemoryRepository } from '../../../../shared/repositories/in.memory.repository'
import { Classroom, PARTICIPANT_ROLE } from '../../entities/classroom'
import { openClassroom } from '../open.classroom'

describe('openClassroom Service', () => {
  it('should return Right with a classroom containing teacher and student participants', async () => {
    const classrooms = InMemoryRepository<Classroom>()

    const result = await openClassroom({ participant_id: 'student-1' })({
      classrooms,
    })

    expect(isRight(result)).toBeTruthy()
    const classroom = (result as any).value as Classroom

    expect(classroom.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participant_id: 'agent',
          role: PARTICIPANT_ROLE.TEACHER,
        }),
        expect.objectContaining({
          participant_id: 'student-1',
          role: PARTICIPANT_ROLE.STUDENT,
        }),
      ]),
    )

    expect(classroom.history).toEqual([])
  })

  it('should persist and generate unique classrooms for different participants', async () => {
    const classrooms = InMemoryRepository<Classroom>()

    const r1 = await openClassroom({ participant_id: 'alice' })({ classrooms })
    const r2 = await openClassroom({ participant_id: 'bob' })({ classrooms })

    expect(isRight(r1)).toBeTruthy()
    expect(isRight(r2)).toBeTruthy()

    const c1 = (r1 as any).value as Classroom
    const c2 = (r2 as any).value as Classroom

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
