import { Left, Repository, Right } from '@davna/core'
import { InMemoryRepository } from '@davna/infra'

import { connectToClassroomHandler } from '../connect.to.classroom.handler'

import { Classroom, PARTICIPANT_ROLE } from '../../entities/classroom'
import { Audio } from '../../entities/audio'
import { Message } from '../../entities/message'
import { Emitter } from '../../helpers/emitter'

import { teacherGeneratesResponse as teacherGeneratesService } from '../../services/teacher.generates.response'
import { showClassroom as showClassroomService } from '../../services/show.classroom'
import { verifyConsume as verifyConsumeService } from '../../services/verify.consume'

jest.mock('../../services/teacher.generates.response', () => ({
  teacherGeneratesResponse: jest.fn(),
}))

jest.mock('../../services/show.classroom', () => ({
  showClassroom: jest.fn(),
}))

jest.mock('../../services/verify.consume', () => ({
  verifyConsume: jest.fn(),
}))

const teacherGeneratesResponse = teacherGeneratesService as any as jest.Mock
const showClassroom = showClassroomService as any as jest.Mock
const verifyConsume = verifyConsumeService as any as jest.Mock

describe('connectToClassroomHandler (updated)', () => {
  const accountId = 'acc-1'
  const teacherId = 'teacher-1'
  const classroomId = 'class-1'

  let audios: Repository<Audio>
  let classrooms: Repository<Classroom>
  let messages: Repository<Message>
  let storage: any
  let messageHandler: any
  let emitter: jest.Mocked<Emitter>

  const multimedia: any = {}
  const storage_driver = 'MONGO_GRIDFS' as any
  const gpt: any = {}

  beforeEach(() => {
    audios = InMemoryRepository<Audio>()
    classrooms = InMemoryRepository<Classroom>()
    messages = InMemoryRepository<Message>()

    storage = () => ({
      upload: jest.fn(),
      download: jest.fn(),
      check: jest.fn(),
    })
    messageHandler = { process: jest.fn() }

    emitter = { emit: jest.fn() } as any

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  function makeReq(data?: any) {
    return {
      data: data ?? {},
      metadata: { account: { id: accountId } },
    } as any
  }

  it('should emit error:service and return error when showClassroom returns Left', async () => {
    const req = makeReq({ classroom_id: classroomId })

    const errorPayload = { message: 'not found' }
    showClassroom.mockImplementationOnce(() => async () => Left(errorPayload))

    const result = await connectToClassroomHandler(req)({
      emitter,
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
      storage_driver,
      gpt,
      multimedia,
    })

    expect(showClassroom).toHaveBeenCalledTimes(1)
    const calledWith = showClassroom.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({
        classroom_id: classroomId,
        participant_id: accountId,
      }),
    )

    expect(emitter.emit).toHaveBeenCalledWith('error:service', {
      status: 'error',
      message: errorPayload.message,
    })

    expect(result).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ status: 'error' }),
      }),
    )
  })

  it('should emit error:service and return error when verifyConsume returns Left', async () => {
    const req = makeReq({ classroom_id: classroomId })

    const classroomWithTeacher: Classroom = {
      id: classroomId,
      participants: [
        { participant_id: 'student-1', role: PARTICIPANT_ROLE.STUDENT },
        { participant_id: teacherId, role: PARTICIPANT_ROLE.TEACHER },
      ],
      history: [],
    } as any

    showClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: classroomWithTeacher }),
    )

    const errorPayload = { message: 'no credits' }
    verifyConsume.mockImplementationOnce(() => async () => Left(errorPayload))

    const result = await connectToClassroomHandler(req)({
      emitter,
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
      storage_driver,
      gpt,
      multimedia,
    })

    expect(showClassroom).toHaveBeenCalledTimes(1)
    expect(verifyConsume).toHaveBeenCalledTimes(1)

    expect(emitter.emit).toHaveBeenCalledWith('error:service', {
      status: 'error',
      message: errorPayload.message,
    })

    expect(result).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ status: 'error' }),
      }),
    )
  })

  it('should emit error:internal and return error when classroom has no teacher', async () => {
    const req = makeReq({ classroom_id: classroomId })

    const classroomNoTeacher: Classroom = {
      id: classroomId,
      participants: [
        { participant_id: 'some-student', role: PARTICIPANT_ROLE.STUDENT },
      ],
      history: [],
    } as any

    showClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: classroomNoTeacher }),
    )

    verifyConsume.mockImplementationOnce(
      () => async () => Right({ consume: 10 }),
    )

    const result = await connectToClassroomHandler(req)({
      emitter,
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
      storage_driver,
      gpt,
      multimedia,
    })

    expect(showClassroom).toHaveBeenCalledTimes(1)
    expect(verifyConsume).toHaveBeenCalledTimes(1)

    expect(emitter.emit).toHaveBeenCalledWith('error:internal', {
      status: 'error',
      message: 'Internal Server Error',
    })

    expect(result).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ status: 'error' }),
      }),
    )
  })

  it('should emit classroom:started, classroom:replying and classroom:updated when classroom is empty and teacherGeneratesResponse succeeds', async () => {
    const req = makeReq({ classroom_id: classroomId })

    const classroomWithTeacher: Classroom = {
      id: classroomId,
      participants: [
        { participant_id: 'student-1', role: PARTICIPANT_ROLE.STUDENT },
        { participant_id: teacherId, role: PARTICIPANT_ROLE.TEACHER },
      ],
      history: [], // empty -> should trigger teacherGeneratesResponse
    } as any

    showClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: classroomWithTeacher }),
    )

    verifyConsume.mockImplementationOnce(
      () => async () => Right({ consume: 50 }),
    )

    const generatedMessage: Message = {
      id: 'm1',
      author: teacherId,
      text: 'auto',
    } as any
    const updatedClassroom = {
      ...classroomWithTeacher,
      history: [generatedMessage],
    } as any

    const teacherResult = Right({
      consume: 40,
      classroom: updatedClassroom,
      message: generatedMessage,
    })

    teacherGeneratesResponse.mockImplementationOnce(
      () => async () => teacherResult,
    )

    const result = await connectToClassroomHandler(req)({
      emitter,
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
      storage_driver,
      gpt,
      multimedia,
    })

    expect(showClassroom).toHaveBeenCalledTimes(1)
    expect(verifyConsume).toHaveBeenCalledTimes(1)
    expect(teacherGeneratesResponse).toHaveBeenCalledTimes(1)

    expect(emitter.emit).toHaveBeenCalledWith(
      'classroom:started',
      expect.objectContaining({
        remainingConsumption: expect.any(Number),
        classroom: classroomWithTeacher,
      }),
    )

    expect(emitter.emit).toHaveBeenCalledWith('classroom:replying', {
      classroom_id: classroomWithTeacher.id,
      participant_id: teacherId,
    })

    expect(emitter.emit).toHaveBeenCalledWith(
      'classroom:updated',
      expect.objectContaining({
        remainingConsumption: expect.any(Number),
        classroom: updatedClassroom,
        message: generatedMessage,
      }),
    )

    expect(result).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ status: 'successful' }),
      }),
    )
  })

  it('should emit classroom:started and skip teacherGeneratesResponse when classroom has history', async () => {
    const req = makeReq({ classroom_id: classroomId })

    const classroomWithHistory: Classroom = {
      id: classroomId,
      participants: [
        { participant_id: 'student-1', role: PARTICIPANT_ROLE.STUDENT },
        { participant_id: teacherId, role: PARTICIPANT_ROLE.TEACHER },
      ],
      history: [{ id: 'm1' } as any], // non-empty -> skip teacherGeneratesResponse
    } as any

    showClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: classroomWithHistory }),
    )

    verifyConsume.mockImplementationOnce(
      () => async () => Right({ consume: 20 }),
    )

    const result = await connectToClassroomHandler(req)({
      emitter,
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
      storage_driver,
      gpt,
      multimedia,
    })

    expect(showClassroom).toHaveBeenCalledTimes(1)
    expect(verifyConsume).toHaveBeenCalledTimes(1)
    expect(teacherGeneratesResponse).not.toHaveBeenCalled()

    expect(emitter.emit).toHaveBeenCalledWith(
      'classroom:started',
      expect.objectContaining({
        remainingConsumption: expect.any(Number),
        classroom: classroomWithHistory,
      }),
    )

    expect(result).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ status: 'successful' }),
      }),
    )
  })

  it('should emit error:service and return error when teacherGeneratesResponse returns Left', async () => {
    const req = makeReq({ classroom_id: classroomId })

    const classroomWithTeacher: Classroom = {
      id: classroomId,
      participants: [
        { participant_id: 'student-1', role: PARTICIPANT_ROLE.STUDENT },
        { participant_id: teacherId, role: PARTICIPANT_ROLE.TEACHER },
      ],
      history: [], // empty -> will call teacherGeneratesResponse
    } as any

    showClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: classroomWithTeacher }),
    )

    verifyConsume.mockImplementationOnce(
      () => async () => Right({ consume: 5 }),
    )

    const errorPayload = { message: 'ai error' }
    teacherGeneratesResponse.mockImplementationOnce(
      () => async () => Left(errorPayload),
    )

    const result = await connectToClassroomHandler(req)({
      emitter,
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
      storage_driver,
      gpt,
      multimedia,
    })

    expect(showClassroom).toHaveBeenCalledTimes(1)
    expect(verifyConsume).toHaveBeenCalledTimes(1)
    expect(teacherGeneratesResponse).toHaveBeenCalledTimes(1)

    expect(emitter.emit).toHaveBeenCalledWith('error:service', {
      status: 'error',
      message: errorPayload.message,
    })

    expect(result).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ status: 'error' }),
      }),
    )
  })
})
