import { isRight, Left, Right } from '../../../../shared/core/either'
import { InMemoryRepository } from '../../../../shared/repositories/in.memory.repository'
import { Classroom, PARTICIPANT_ROLE } from '../../entities/classroom'
import { Message } from '../../entities/message'
import { openClassroom } from '../open.classroom'
import { verifyConsume as verifyConsumeService } from '../verify.consume'

jest.mock('../verify.consume', () => ({
  verifyConsume: jest.fn(),
}))

const verifyConsume = verifyConsumeService as unknown as jest.Mock

describe('openClassroom (service) - updated behavior', () => {
  let classrooms: ReturnType<typeof InMemoryRepository<Classroom>>
  let messages: ReturnType<typeof InMemoryRepository<Message>>

  beforeEach(async () => {
    classrooms = InMemoryRepository<Classroom>()
    messages = InMemoryRepository<Message>()

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return Right with a classroom containing teacher and student participants and consume from verifyConsume', async () => {
    // verifyConsume returns Right with consume
    const consumePayload = { consume: 42 }
    verifyConsume.mockImplementationOnce(
      () => async () => Right(consumePayload),
    )

    const participant_id = 'student-1'

    const result = await openClassroom({ participant_id })({
      classrooms,
      messages,
    })

    expect(isRight(result)).toBeTruthy()
    const value = (result as any).value as {
      classroom: Classroom
      consume: number
    }

    const classroom = value.classroom
    expect(value.consume).toEqual(consumePayload.consume)

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
    // verifyConsume returns Right so both calls proceed
    verifyConsume.mockImplementation(() => async () => Right({ consume: 0 }))

    const r1 = await openClassroom({ participant_id: 'alice' })({
      classrooms,
      messages,
    })
    const r2 = await openClassroom({ participant_id: 'bob' })({
      classrooms,
      messages,
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

  it('should forward Left from verifyConsume', async () => {
    const errorPayload = { status: 'error', message: 'cannot consume' }
    verifyConsume.mockImplementationOnce(() => async () => Left(errorPayload))

    const participant_id = 'student-x'

    const result = await openClassroom({ participant_id })({
      classrooms,
      messages,
    })

    expect(result).toEqual(Left(errorPayload))
  })
})
