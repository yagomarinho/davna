import { Left, Right } from '../../../../shared/core/either'
import { Request } from '../../../../shared/core/request'
import { InMemoryRepository } from '../../../../shared/repositories/in.memory.repository'
import { Repository } from '../../../../shared/core/repository'

import { appendAndReplyHandler } from '../append.and.reply.handler'
import { appendMessageToClassroom as appendMessageService } from '../../services/append.message.to.classroom'
import { teacherGeneratesResponse as teacherGeneratesService } from '../../services/teacher.generates.response'
import { getTranscriptionFromAudio as getTranscription } from '../../utils/get.transcription.from.audio'

import { Audio, SUPORTED_MIME_TYPE } from '../../entities/audio'
import { Classroom, PARTICIPANT_ROLE } from '../../entities/classroom'
import { Message, MESSAGE_TYPE } from '../../entities/message'
import { STORAGE_TYPE } from '../../../../shared/providers/storage/storage'

jest.mock('../../services/append.message.to.classroom', () => ({
  appendMessageToClassroom: jest.fn(),
}))

jest.mock('../../services/teacher.generates.response', () => ({
  teacherGeneratesResponse: jest.fn(),
}))

jest.mock('../../utils/get.transcription.from.audio', () => ({
  getTranscriptionFromAudio: jest.fn(),
}))

const appendMessageToClassroom = appendMessageService as any as jest.Mock
const teacherGeneratesResponse = teacherGeneratesService as any as jest.Mock
const getTranscriptionFromAudio = getTranscription as any as jest.Mock

describe('appendAndReply handler', () => {
  const classroom_id = 'class-1'
  const participant_id = 'student-1'
  const teacher_id = 'teacher-1'
  const audio_id = 'audio-1'
  const internalRef = 'ref-1'

  let audios: Repository<Audio>
  let classrooms: Repository<Classroom>
  let messages: Repository<Message>
  let storage: any
  let messageHandler: any
  let emitter: { emit: jest.Mock }

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
          storage: STORAGE_TYPE.MONGO_GRIDFS,
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

  it('should emit error:service and return failed when appendMessageToClassroom returns Left', async () => {
    const req = makeReq()
    const transcription = { transcription: 't', translation: 'tr' }
    getTranscriptionFromAudio.mockImplementationOnce(
      () => async () => transcription,
    )

    const errorPayload = { status: 'error', message: 'cannot append' }
    appendMessageToClassroom.mockImplementationOnce(
      () => async () => Left(errorPayload),
    )

    const result = await appendAndReplyHandler(req)({
      audios,
      classrooms,
      emitter,
      messageHandler,
      messages,
      storage,
    } as any)

    expect(getTranscriptionFromAudio).toHaveBeenCalledTimes(1)
    expect(appendMessageToClassroom).toHaveBeenCalledTimes(1)

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
    const transcription = { transcription: 't', translation: 'tr' }
    getTranscriptionFromAudio.mockImplementationOnce(
      () => async () => transcription,
    )

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
      transcription: 't',
      translation: 'tr',
    } as any

    appendMessageToClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: classroomNoTeacher, message }),
    )

    const result = await appendAndReplyHandler(req)({
      audios,
      classrooms,
      emitter,
      messageHandler,
      messages,
      storage,
    } as any)

    expect(appendMessageToClassroom).toHaveBeenCalledTimes(1)
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
    const transcription = { transcription: 't', translation: 'tr' }
    getTranscriptionFromAudio.mockImplementationOnce(
      () => async () => transcription,
    )

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
      transcription: 't',
      translation: 'tr',
    } as any

    appendMessageToClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: classroomWithTeacher, message }),
    )

    const errorPayload = { status: 'error', message: 'ai failed' }
    teacherGeneratesResponse.mockImplementationOnce(
      () => async () => Left(errorPayload),
    )

    const result = await appendAndReplyHandler(req)({
      audios,
      classrooms,
      emitter,
      messageHandler,
      messages,
      storage,
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

  it('should return successful when appendMessageToClassroom and teacherGeneratesResponse succeed', async () => {
    const req = makeReq()
    const transcription = { transcription: 't', translation: 'tr' }
    getTranscriptionFromAudio.mockImplementationOnce(
      () => async () => transcription,
    )

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
      transcription: 't',
      translation: 'tr',
    } as any

    appendMessageToClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: classroomWithTeacher, message }),
    )

    const teacherResult = Right({
      consume: 40 * 60 * 1000, // 40 minutes
      classroom: classroomWithTeacher,
      message,
    })
    teacherGeneratesResponse.mockImplementationOnce(
      () => async () => teacherResult,
    )

    const result = await appendAndReplyHandler(req)({
      audios,
      classrooms,
      emitter,
      messageHandler,
      messages,
      storage,
    } as any)

    expect(appendMessageToClassroom).toHaveBeenCalledTimes(1)
    expect(teacherGeneratesResponse).toHaveBeenCalledTimes(1)
    expect(emitter.emit).not.toHaveBeenCalledWith(
      'error:service',
      expect.anything(),
    )
    expect(emitter.emit).not.toHaveBeenCalledWith(
      'error:internal',
      expect.anything(),
    )

    expect(emitter.emit).toHaveBeenNthCalledWith(
      3,
      'classroom:updated',
      expect.objectContaining({ remainingConsumption: 20 * 60 * 1000 }), // 20 minutes
    )

    expect(result).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ status: 'successful' }),
      }),
    )
  })
})
