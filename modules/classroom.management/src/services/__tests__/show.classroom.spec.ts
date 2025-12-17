import { isRight, Repository } from '@davna/core'
import { InMemoryRepository } from '@davna/infra'
import {
  Audio,
  AudioMessage,
  Classroom,
  Message,
  MESSAGE_TYPE,
  PARTICIPANT_ROLE,
  SUPORTED_MIME_TYPE,
} from '../../entities'
import { showClassroom } from '../show.classroom'

describe('showClassroom (service) - updated behavior', () => {
  const transcription = 'This is transcription'
  const translation = 'This is translation'

  let classrooms: Repository<Classroom>
  let messages: Repository<Message>

  beforeEach(async () => {
    classrooms = InMemoryRepository<Classroom>()
    messages = InMemoryRepository<Message>()

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return Right with classroom and full history when participant is present', async () => {
    const classroom_id = 'classroom-1'
    const participant_id = 'student-1'

    let message1: Message = AudioMessage.create({
      classroom_id,
      participant_id,
      transcription,
      translation,
      type: MESSAGE_TYPE.AUDIO,
      data: Audio.create({
        id: 'audio.id',
        owner_id: participant_id,
        name: 'audio',
        duration: 3000,
        mime: SUPORTED_MIME_TYPE.MP4,
        src: '/download/audio.id',
      }),
    })

    let message2: Message = AudioMessage.create({
      classroom_id,
      participant_id: 'agent',
      transcription,
      translation,
      type: MESSAGE_TYPE.AUDIO,
      data: Audio.create({
        id: 'audio.id',
        owner_id: participant_id,
        name: 'audio',
        duration: 3000,
        mime: SUPORTED_MIME_TYPE.MP4,
        src: '/download/audio.id',
      }),
    })

    message1 = await messages.set(message1)
    message2 = await messages.set(message2)

    const classroom: Classroom = Classroom.create({
      id: classroom_id,
      owner_id: participant_id,
      participants: [
        { participant_id: 'agent', role: PARTICIPANT_ROLE.TEACHER },
        { participant_id, role: PARTICIPANT_ROLE.STUDENT },
      ],
      history: [message1.id, message2.id],
    })

    await classrooms.set(classroom)

    const result = await showClassroom({ classroom_id, participant_id })({
      classrooms,
      messages,
    })

    expect(isRight(result)).toBeTruthy()

    const value = (result as any).value as {
      classroom: Omit<Classroom, 'history'> & { history: Message[] }
    }

    expect(value.classroom.id).toEqual(classroom_id)
    expect(value.classroom.participants).toEqual(
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

    expect(value.classroom.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: message1.id }),
        expect.objectContaining({ id: message2.id }),
      ]),
    )
  })

  it('should return Left when classroom is not found', async () => {
    const classroom_id = 'non-existent'
    const participant_id = 'student-1'

    const result = await showClassroom({ classroom_id, participant_id })({
      classrooms,
      messages,
    })

    expect(isRight(result)).toBeFalsy()

    const value = (result as any).value
    expect(value).toEqual({
      status: 'error',
      message: 'Classroom not founded',
    })
  })

  it('should return Left when participant is not authorized to view the classroom', async () => {
    const classroom_id = 'classroom-2'
    const participant_id = 'intruder'

    const classroom: Classroom = Classroom.create({
      id: classroom_id,
      owner_id: 'student-2',
      participants: [
        { participant_id: 'agent', role: PARTICIPANT_ROLE.TEACHER },
        { participant_id: 'student-2', role: PARTICIPANT_ROLE.STUDENT },
      ],
      history: [],
    })

    await classrooms.set(classroom)

    const result = await showClassroom({ classroom_id, participant_id })({
      classrooms,
      messages,
    })

    expect(isRight(result)).toBeFalsy()

    const value = (result as any).value
    expect(value).toEqual({
      status: 'error',
      message: 'Not authorized to get this classroom',
    })
  })
})
