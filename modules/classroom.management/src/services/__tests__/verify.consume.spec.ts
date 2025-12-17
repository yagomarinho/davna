import { Left, Repository, Right } from '@davna/core'
import { InMemoryRepository } from '@davna/infra'

import { Classroom } from '../../entities/classroom'
import { Message, MESSAGE_TYPE } from '../../entities/message'

import { verifyConsume } from '../verify.consume'

describe('verifyConsume (service)', () => {
  let classrooms: Repository<Classroom>
  let messages: Repository<Message>

  const owner_id = 'owner-1'
  const other_owner = 'owner-2'

  const actualDay = new Date(new Date().toDateString())
  const yesterday = new Date(actualDay)
  yesterday.setDate(yesterday.getDate() - 1)

  beforeEach(async () => {
    classrooms = InMemoryRepository<Classroom>()
    messages = InMemoryRepository<Message>()

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return Right with total consume (less than 1h) when user has classes updated today', async () => {
    const classroomToCheck: Classroom = {
      id: 'class-check',
      owner_id,
      participants: [],
      history: ['m1', 'm2'],
      updated_at: actualDay,
    } as any

    const classIgnored: Classroom = {
      id: 'class-old',
      owner_id,
      participants: [],
      history: ['m3'],
      updated_at: yesterday,
    } as any

    await classrooms.set(classroomToCheck)
    await classrooms.set(classIgnored)

    // two messages in history; only m1 and m2 are in the class we care about
    const msg1: Message = {
      id: 'm1',
      participant_id: 'p1',
      type: MESSAGE_TYPE.AUDIO,
      created_at: new Date(actualDay.getTime() + 1000), // later today
      data: { duration: 30 * 60 * 1000 }, // 30 minutes
    } as any

    const msg2: Message = {
      id: 'm2',
      participant_id: 'p2',
      type: MESSAGE_TYPE.AUDIO,
      created_at: new Date(actualDay.getTime() + 2000),
      data: { duration: 20 * 60 * 1000 }, // 20 minutes
    } as any

    // message from old class (should be ignored because class updated_at is yesterday)
    const msg3: Message = {
      id: 'm3',
      participant_id: 'p3',
      type: MESSAGE_TYPE.AUDIO,
      created_at: new Date(actualDay.getTime() + 3000),
      data: { duration: 120 * 60 * 1000 }, // 2 hours
    } as any

    await messages.set(msg1)
    await messages.set(msg2)
    await messages.set(msg3)

    const svc = verifyConsume({ classroom: classroomToCheck })

    const result = await svc({
      classrooms,
      messages,
    })

    const expectedConsume = msg1.data.duration + msg2.data.duration // 50 minutes in ms

    expect(result).toEqual(Right({ consume: expectedConsume }))
  })

  it('should return Left when total consume for today is >= 1 hour', async () => {
    const classroomToCheck: Classroom = {
      id: 'class-check-2',
      owner_id,
      participants: [],
      history: ['m4', 'm5'],
      updated_at: actualDay,
    } as any

    await classrooms.set(classroomToCheck)

    const msg4: Message = {
      id: 'm4',
      participant_id: 'p1',
      type: MESSAGE_TYPE.AUDIO,
      created_at: new Date(actualDay.getTime() + 1000),
      data: { duration: 30 * 60 * 1000 }, // 30 min
    } as any

    const msg5: Message = {
      id: 'm5',
      participant_id: 'p2',
      type: MESSAGE_TYPE.AUDIO,
      created_at: new Date(actualDay.getTime() + 2000),
      data: { duration: 30 * 60 * 1000 }, // 30 min -> total 1h
    } as any

    await messages.set(msg4)
    await messages.set(msg5)

    const svc = verifyConsume({ classroom: classroomToCheck })

    const result = await svc({
      classrooms,
      messages,
    })

    expect(result).toEqual(
      Left({
        status: 'error',
        message: "This user can't consume more today",
      }),
    )
  })

  it('should ignore classes not owned by the classroom owner and return Right 0 when no matching messages', async () => {
    const classroomToCheck: Classroom = {
      id: 'class-check-3',
      owner_id,
      participants: [],
      history: [],
      updated_at: actualDay,
    } as any

    const otherClass: Classroom = {
      id: 'class-other',
      owner_id: other_owner,
      participants: [],
      history: ['mx'],
      updated_at: actualDay,
    } as any

    await classrooms.set(classroomToCheck)
    await classrooms.set(otherClass)

    // message from other owner's class - should be ignored
    const mx: Message = {
      id: 'mx',
      participant_id: 'pX',
      type: MESSAGE_TYPE.AUDIO,
      created_at: new Date(actualDay.getTime() + 1000),
      data: { duration: 2 * 60 * 1000 },
    } as any

    await messages.set(mx)

    const svc = verifyConsume({ classroom: classroomToCheck })

    const result = await svc({
      classrooms,
      messages,
    })

    expect(result).toEqual(Right({ consume: 0 }))
  })
})
