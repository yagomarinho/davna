import { isLeft, isRight } from '@davna/core'
import { IDContext } from '@davna/infra'

import {
  Classroom,
  createClassroom,
  createParticipant,
  createParticipation,
  Message,
  OccursIn,
  PARTICIPANT_ROLE,
  Source,
} from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'

import { IDContextFake } from '../../__fakes__/id.context.fake'
import { ClassroomFedFake } from '../../__fakes__/classroom.fed.fake'
import { appendMessageToClassroom } from '../append.message.to.classroom'

describe('append message to classroom service', () => {
  let repository: ClassroomFedRepository
  let IDContext: IDContext

  beforeEach(async () => {
    IDContext = IDContextFake()
    repository = ClassroomFedFake({ IDContext })

    jest.clearAllMocks()
  })

  it('should append a message to classroom when participant belongs to classroom', async () => {
    const [participant, classroom] = await Promise.all([
      repository.methods.set(
        createParticipant({ subject_id: 'user-1', type: 'costumer' }),
      ),
      repository.methods.set(createClassroom({ name: '' })),
    ])

    await repository.methods.set(
      createParticipation({
        source_id: participant.meta.id,
        target_id: classroom.meta.id,
        participant_role: PARTICIPANT_ROLE.STUDENT,
      }),
    )

    const result = await appendMessageToClassroom({
      classroom_id: classroom.meta.id,
      participant_id: participant.meta.id,
      message_type: 'text',
      data: { type: 'content', content: 'hello' },
    })({
      repository,
    })

    expect(isRight(result)).toBeTruthy()

    const {
      classroom: c,
      message,
      source,
      occursIn,
    } = (result as any).value as {
      classroom: Classroom
      message: Message
      source: Source
      occursIn: OccursIn
    }

    expect(c.meta.id).toEqual(classroom.meta.id)
    expect(message.meta.id).toEqual(expect.any(String))

    expect(source).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          target_id: message.meta.id,
        }),
      }),
    )

    expect(occursIn).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          source_id: message.meta.id,
          target_id: classroom.meta.id,
        }),
      }),
    )
  })

  it('should return Left when participant does not belong to classroom', async () => {
    const [participant, classroom] = await Promise.all([
      repository.methods.set(
        createParticipant({ subject_id: 'user-1', type: 'costumer' }),
      ),
      repository.methods.set(createClassroom({ name: 'classroom' })),
    ])

    const result = await appendMessageToClassroom({
      classroom_id: classroom.meta.id,
      participant_id: participant.meta.id,
      message_type: 'text',
      data: { type: 'content', content: 'hello' },
    })({
      repository,
    })

    expect(isLeft(result)).toBeTruthy()
  })

  it('should return Left when resource resolver returns Left', async () => {
    const [participant, classroom] = await Promise.all([
      repository.methods.set(
        createParticipant({ subject_id: 'user-1', type: 'costumer' }),
      ),
      repository.methods.set(createClassroom({ name: 'classroom' })),
    ])

    await repository.methods.set(
      createParticipation({
        source_id: participant.meta.id,
        target_id: classroom.meta.id,
        participant_role: PARTICIPANT_ROLE.STUDENT,
      }),
    )

    const result = await appendMessageToClassroom({
      classroom_id: classroom.meta.id,
      participant_id: participant.meta.id,
      message_type: 'invalid' as any,
      data: {} as any,
    })({
      repository,
    })

    expect(isLeft(result)).toBeTruthy()
  })
})
