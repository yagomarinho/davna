import { Left, Repository, Request, Right } from '@davna/core'
import { FakeAI, STORAGE_TYPE } from '@davna/providers'
import { InMemoryRepository } from '@davna/repositories'

import { initializeClassroomHandler } from '../initialize.classroom.handler'
import { openClassroom as openClassroomService } from '../../services/open.classroom'
import { teacherGeneratesResponse as teacherGeneratesService } from '../../services/teacher.generates.response'

import { Classroom, PARTICIPANT_ROLE } from '../../entities/classroom'
import { Audio } from '../../entities/audio'
import { Message } from '../../entities/message'

jest.mock('../../services/open.classroom', () => ({
  openClassroom: jest.fn(),
}))

jest.mock('../../services/teacher.generates.response', () => ({
  teacherGeneratesResponse: jest.fn(),
}))

const openClassroom = openClassroomService as any as jest.Mock
const teacherGeneratesResponse = teacherGeneratesService as any as jest.Mock

describe('initializeClassroomHandler', () => {
  const accountId = 'acc-1'
  const teacherId = 'teacher-1'

  let audios: Repository<Audio>
  let classrooms: Repository<Classroom>
  let messages: Repository<Message>
  let storage: any
  let messageHandler: any
  let emitter: { emit: jest.Mock }
  const storage_driver = STORAGE_TYPE.MONGO_GRIDFS

  const gpt = FakeAI({
    pathToSpeech: '',
    textFromSpeech: '',
    textToRespond: '',
  })

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

    emitter = { emit: jest.fn() }

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  function makeReq() {
    return Request.metadata({
      account: { id: accountId },
    })
  }

  it('should emit error:service and return error when openClassroom returns Left', async () => {
    const req = makeReq()

    const errorPayload = { message: 'open failed' }
    openClassroom.mockImplementationOnce(() => async () => Left(errorPayload))

    const result = await initializeClassroomHandler(req)({
      emitter,
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
      storage_driver,
      gpt,
    } as any)

    expect(openClassroom).toHaveBeenCalledTimes(1)
    const calledWith = openClassroom.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({ participant_id: accountId }),
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

  it('should emit error:internal and return error when openClassroom returns classroom without teacher', async () => {
    const req = makeReq()

    const classroomNoTeacher: Classroom = {
      id: 'class-1',
      participants: [
        { participant_id: 'some-student', role: PARTICIPANT_ROLE.STUDENT },
      ],
      history: [],
    } as any

    openClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: classroomNoTeacher, consume: 42 }),
    )

    const result = await initializeClassroomHandler(req)({
      emitter,
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
      storage_driver,
      gpt,
    } as any)

    expect(openClassroom).toHaveBeenCalledTimes(1)
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

  it('should emit error:service and return error when teacherGeneratesResponse returns Left', async () => {
    const req = makeReq()

    const classroomWithTeacher: Classroom = {
      id: 'class-1',
      participants: [
        { participant_id: 'student-1', role: PARTICIPANT_ROLE.STUDENT },
        { participant_id: teacherId, role: PARTICIPANT_ROLE.TEACHER },
      ],
      history: [],
    } as any

    openClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: classroomWithTeacher, consume: 42 }),
    )

    const errorPayload = { message: 'ai failed' }
    teacherGeneratesResponse.mockImplementationOnce(
      () => async () => Left(errorPayload),
    )

    const result = await initializeClassroomHandler(req)({
      emitter,
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
      storage_driver,
      gpt,
    } as any)

    expect(openClassroom).toHaveBeenCalledTimes(1)
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

  it('should return successful when openClassroom and teacherGeneratesResponse succeed', async () => {
    const req = makeReq()

    const classroomWithTeacher: Classroom = {
      id: 'class-1',
      participants: [
        { participant_id: 'student-1', role: PARTICIPANT_ROLE.STUDENT },
        { participant_id: teacherId, role: PARTICIPANT_ROLE.TEACHER },
      ],
      history: [],
    } as any

    openClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: classroomWithTeacher, consume: 42 }),
    )

    const teacherResult = Right({
      consume: 40,
      classroom: classroomWithTeacher,
      message: null,
    })
    teacherGeneratesResponse.mockImplementationOnce(
      () => async () => teacherResult,
    )

    const result = await initializeClassroomHandler(req)({
      emitter,
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
      storage_driver,
      gpt,
    } as any)

    expect(openClassroom).toHaveBeenCalledTimes(1)
    expect(teacherGeneratesResponse).toHaveBeenCalledTimes(1)

    expect(emitter.emit).not.toHaveBeenCalledWith(
      'error:service',
      expect.anything(),
    )
    expect(emitter.emit).not.toHaveBeenCalledWith(
      'error:internal',
      expect.anything(),
    )

    expect(result).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ status: 'successful' }),
      }),
    )
  })
})
