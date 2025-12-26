import type { GPTModel } from '@davna/infra'
import { Left, Right, Request, Repository } from '@davna/core'

import { InMemoryRepository } from '@davna/infra'
import { FakeAI, STORAGE_TYPE as _STORAGE_TYPE } from '@davna/infra'

import { appendAndReplyHandler } from '../append.and.reply.handler'

import { Audio, SUPORTED_MIME_TYPE } from '../../entities/audio'
import { Classroom, PARTICIPANT_ROLE } from '../../entities/classroom'
import { Message, MESSAGE_TYPE } from '../../entities/message'

import { transcribeAndAppend as transcribeAndAppendService } from '../../services/transcribe.and.append'
import { teacherGeneratesResponse as teacherGeneratesService } from '../../services/teacher.generates.response'

jest.mock('../../services/transcribe.and.append', () => ({
  transcribeAndAppend: jest.fn(),
}))

jest.mock('../../services/teacher.generates.response', () => ({
  teacherGeneratesResponse: jest.fn(),
}))

const transcribeAndAppend = transcribeAndAppendService as any as jest.Mock
const teacherGeneratesResponse = teacherGeneratesService as any as jest.Mock

describe('appendAndReplyHandler', () => {
  const classroom_id = 'class-1'
  const participant_id = 'student-1'
  const teacher_id = 'teacher-1'
  const audio_id = 'audio-1'
  const internalRef = 'ref-1'
  const tempDir = 'temp.dir'
  const storage_driver = _STORAGE_TYPE.MONGO_GRIDFS

  let audios: Repository<Audio>
  let classrooms: Repository<Classroom>
  let messages: Repository<Message>
  let storage: any
  let messageHandler: any
  let emitter: { emit: jest.Mock }
  const gpt = FakeAI({
    textToRespond: 'to respond',
    pathToSpeech: '/path',
    textFromSpeech: 'from speech',
  }) as unknown as GPTModel

  beforeEach(async () => {
    audios = InMemoryRepository<Audio>()
    classrooms = InMemoryRepository<Classroom>()
    messages = InMemoryRepository<Message>()

    storage = () => ({
      check: jest.fn(),
      upload: jest.fn(),
      download: jest.fn(),
    })
    messageHandler = { process: jest.fn() }
    emitter = { emit: jest.fn() }

    const classroomSeed: Classroom = {
      id: classroom_id,
      participants: [{ participant_id, role: PARTICIPANT_ROLE.STUDENT }],
      history: [],
    } as any

    await classrooms.set(classroomSeed)

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  function makeReq(dataOverride = {}) {
    const data = {
      classroom_id,
      type: MESSAGE_TYPE.AUDIO,
      data: Audio.create({
        id: audio_id,
        owner_id: 'owner.id',
        name: 'audio.name',
        mime: SUPORTED_MIME_TYPE.OPUS,
        duration: 3000,
        internal_ref: {
          identifier: internalRef,
          storage: _STORAGE_TYPE.MONGO_GRIDFS,
        },
        src: 'src',
      }),
      ...dataOverride,
    }

    const metadata = {
      account: { id: participant_id },
    }

    return Request({ data, metadata })
  }

  it('should emit error:service and return failed when transcribeAndAppend returns Left', async () => {
    const req = makeReq()

    const errorPayload = { status: 'error', message: 'cannot append' }
    transcribeAndAppend.mockImplementationOnce(
      () => async () => Left(errorPayload),
    )

    const result = await appendAndReplyHandler(req)({
      audios,
      classrooms,
      emitter,
      gpt,
      messageHandler,
      messages,
      storage,
      storage_driver,
      tempDir,
    } as any)

    expect(transcribeAndAppend).toHaveBeenCalledTimes(1)

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

  it('should emit error:internal and return failed when classroom has no teacher', async () => {
    const req = makeReq()

    const classroomNoTeacher: Classroom = {
      id: classroom_id,
      participants: [{ participant_id, role: PARTICIPANT_ROLE.STUDENT }],
      history: ['m1'],
    } as any

    const message: Message = {
      id: 'm1',
      participant_id,
      type: MESSAGE_TYPE.AUDIO,
      data: { id: audio_id, internal_ref: { identifier: internalRef } },
    } as any

    transcribeAndAppend.mockImplementationOnce(
      () => async () =>
        Right({ classroom: classroomNoTeacher, message, consume: 0 }),
    )

    const result = await appendAndReplyHandler(req)({
      audios,
      classrooms,
      emitter,
      gpt,
      messageHandler,
      messages,
      storage,
      storage_driver,
      tempDir,
    } as any)

    expect(transcribeAndAppend).toHaveBeenCalledTimes(1)
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

  it('should emit error:service and return failed when teacherGeneratesResponse returns Left', async () => {
    const req = makeReq()

    const classroomWithTeacher: Classroom = {
      id: classroom_id,
      participants: [
        { participant_id, role: PARTICIPANT_ROLE.STUDENT },
        { participant_id: teacher_id, role: PARTICIPANT_ROLE.TEACHER },
      ],
      history: ['m1'],
    } as any

    const message: Message = {
      id: 'm1',
      participant_id,
      type: MESSAGE_TYPE.AUDIO,
      data: { id: audio_id, internal_ref: { identifier: internalRef } },
    } as any

    transcribeAndAppend.mockImplementationOnce(
      () => async () =>
        Right({ classroom: classroomWithTeacher, message, consume: 0 }),
    )

    const errorPayload = { status: 'error', message: 'ai failed' }
    teacherGeneratesResponse.mockImplementationOnce(
      () => async () => Left(errorPayload),
    )

    const result = await appendAndReplyHandler(req)({
      audios,
      classrooms,
      emitter,
      gpt,
      messageHandler,
      messages,
      storage,
      storage_driver,
      tempDir,
    } as any)

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

  it('should return successful when transcribeAndAppend and teacherGeneratesResponse succeed', async () => {
    const req = makeReq()

    const classroomWithTeacher: Classroom = {
      id: classroom_id,
      participants: [
        { participant_id, role: PARTICIPANT_ROLE.STUDENT },
        { participant_id: teacher_id, role: PARTICIPANT_ROLE.TEACHER },
      ],
      history: ['m1'],
    } as any

    const message: Message = {
      id: 'm1',
      participant_id,
      type: MESSAGE_TYPE.AUDIO,
      data: { id: audio_id, internal_ref: { identifier: internalRef } },
    } as any

    transcribeAndAppend.mockImplementationOnce(
      () => async () =>
        Right({
          classroom: classroomWithTeacher,
          message,
          consume: 20 * 60 * 1000, // 20 minutes
        }),
    )

    const teacherResult = Right({
      consume: 40 * 60 * 1000, // 40 minutes
      classroom: classroomWithTeacher,
      message,
    })

    teacherGeneratesResponse.mockImplementation(() => async () => teacherResult)

    const result = await appendAndReplyHandler(req)({
      audios,
      classrooms,
      emitter,
      gpt,
      messageHandler,
      messages,
      storage,
      storage_driver,
      tempDir,
    } as any)

    expect(transcribeAndAppend).toHaveBeenCalledTimes(1)
    expect(teacherGeneratesResponse).toHaveBeenCalledTimes(1)

    // classroom:updated should be emitted for transcribeAndAppend and for teacher response
    expect(emitter.emit).toHaveBeenNthCalledWith(
      1,
      'classroom:replying',
      expect.objectContaining({
        classroom_id: classroomWithTeacher.id,
        participant_id,
      }),
    )

    expect(emitter.emit).toHaveBeenNthCalledWith(
      2,
      'classroom:updated',
      expect.objectContaining({
        classroom: classroomWithTeacher,
        message,
        remainingConsumption: 40 * 60 * 1000,
      }),
    )

    expect(emitter.emit).toHaveBeenNthCalledWith(
      3,
      'classroom:replying',
      expect.objectContaining({
        classroom_id: classroomWithTeacher.id,
        participant_id: teacher_id,
      }),
    )

    expect(emitter.emit).toHaveBeenNthCalledWith(
      4,
      'classroom:updated',
      expect.objectContaining({
        classroom: classroomWithTeacher,
        message,
        remainingConsumption: 20 * 60 * 1000,
      }),
    )

    expect(result).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ status: 'successful' }),
      }),
    )
  })
})
