import { AIGenerateResponse as AIGenerateResponseService } from '../../utils/ai.generate.response'
import { appendMessageToClassroom as appendMessageService } from '../append.message.to.classroom'

import { Message, MESSAGE_TYPE } from '../../entities/message'
import { Classroom } from '../../entities/classroom'
import { Audio } from '../../entities/audio'
import { Repository } from '../../../../shared/core/repository'
import { InMemoryRepository } from '../../../../shared/repositories/in.memory.repository'
import { Left, Right } from '../../../../shared/core/either'
import { teacherGeneratesResponse } from '../teacher.generates.response'

jest.mock('../../utils/ai.generate.response', () => ({
  AIGenerateResponse: jest.fn(),
}))

jest.mock('../append.message.to.classroom', () => ({
  appendMessageToClassroom: jest.fn(),
}))

const AIGenerateResponse = AIGenerateResponseService as unknown as jest.Mock
const appendMessageToClassroom = appendMessageService as unknown as jest.Mock

describe('teacherGeneratesResponse (service)', () => {
  let messages: Repository<Message>
  let classrooms: Repository<Classroom>
  let audios: Repository<Audio>
  let storage: any
  let messageHandler: any

  const teacher_id = 'teacher-1'
  const student_id = 'student-1'

  const classroom: Classroom = {
    id: 'class-1',
    participants: [
      { participant_id: student_id, role: 'student' },
      { participant_id: teacher_id, role: 'teacher' },
    ],
    history: ['m1', 'm2'],
  } as any

  const messagesSeed: Message[] = [
    {
      id: 'm1',
      participant_id: student_id,
      transcription: 'Hello teacher',
      translation: 'Olá professor',
      type: MESSAGE_TYPE.AUDIO,
    } as any,
    {
      id: 'm2',
      participant_id: teacher_id,
      transcription: 'Hello student',
      translation: 'Olá aluno',
      type: MESSAGE_TYPE.AUDIO,
    } as any,
  ]

  beforeEach(async () => {
    messages = InMemoryRepository<Message>()
    classrooms = InMemoryRepository<Classroom>()
    audios = InMemoryRepository<Audio>()

    storage = () => ({
      download: jest.fn(),
      upload: jest.fn(),
      check: jest.fn(),
    })

    messageHandler = { process: jest.fn() }

    await classrooms.set(classroom)
    for (const m of messagesSeed) await messages.set(m)

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call AI with mapped history and forward result to appendMessageToClassroom (happy path)', async () => {
    const inputExpectation = [
      { role: 'user', content: 'Hello teacher' },
      { role: 'assistant', content: 'Hello student' },
    ]

    const fakeAIResult = {
      audio: Buffer.from('audio-bytes'),
      transcription: 'AI transcribed text',
      translation: 'AI translated text',
    }

    AIGenerateResponse.mockImplementationOnce(() => async () => fakeAIResult)

    const appendReturn = Right({
      classroom: { ...classroom, history: classroom.history.concat('m-new') },
      message: {
        id: 'm-new',
        participant_id: teacher_id,
        type: MESSAGE_TYPE.AUDIO,
      } as any,
    })
    appendMessageToClassroom.mockImplementationOnce(
      () => async () => appendReturn,
    )

    const svc = teacherGeneratesResponse({
      classroom,
      teacher_id,
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
    })

    expect(AIGenerateResponse).toHaveBeenCalledTimes(1)
    const aiCallArg = AIGenerateResponse.mock.calls[0][0]
    expect(aiCallArg).toBeDefined()
    expect(aiCallArg.input).toEqual(inputExpectation)

    expect(appendMessageToClassroom).toHaveBeenCalledTimes(1)
    const appendCallArg = appendMessageToClassroom.mock.calls[0][0]
    expect(appendCallArg).toEqual(
      expect.objectContaining({
        classroom_id: classroom.id,
        participant_id: teacher_id,
        message_type: MESSAGE_TYPE.AUDIO,
        transcription: fakeAIResult.transcription,
        translation: fakeAIResult.translation,
        data: fakeAIResult.audio,
      }),
    )

    expect(result).toEqual(appendReturn)
  })

  it('should forward Left from appendMessageToClassroom (AI ok but append fails)', async () => {
    const fakeAIResult = {
      audio: Buffer.from('audio-bytes'),
      transcription: 'AI transcribed text',
      translation: 'AI translated text',
    }

    AIGenerateResponse.mockImplementationOnce(() => async () => fakeAIResult)

    const errorPayload = { status: 'error', message: 'cannot append' }
    appendMessageToClassroom.mockImplementationOnce(
      () => async () => Left(errorPayload),
    )

    const svc = teacherGeneratesResponse({
      classroom,
      teacher_id,
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
    })

    expect(appendMessageToClassroom).toHaveBeenCalledTimes(1)

    expect(result).toEqual(Left(errorPayload))
  })

  it('should reject if AIGenerateResponse throws', async () => {
    AIGenerateResponse.mockImplementationOnce(() => async () => {
      throw new Error('AI failure')
    })

    const svc = teacherGeneratesResponse({
      classroom,
      teacher_id,
    })

    await expect(
      svc({
        audios,
        classrooms,
        messages,
        messageHandler,
        storage,
      }),
    ).rejects.toThrow('AI failure')

    expect(appendMessageToClassroom).not.toHaveBeenCalled()
  })

  it('should handle empty role mapping (ignore messages without role)', async () => {
    const classroomWithUnknown = {
      ...classroom,
      history: ['m1', 'm3'],
    } as any

    const unknownMessage: Message = {
      id: 'm3',
      participant_id: 'unknown',
      transcription: 'Unknown says hi',
      translation: 'Unknown diz oi',
      type: MESSAGE_TYPE.AUDIO,
    } as any
    await messages.set(unknownMessage)

    AIGenerateResponse.mockImplementationOnce(() => async () => ({
      audio: Buffer.from('a'),
      transcription: 't',
      translation: 'tr',
    }))

    appendMessageToClassroom.mockImplementationOnce(
      () => async () => Right({ classroom: {}, message: {} as any }),
    )

    const svc = teacherGeneratesResponse({
      classroom: classroomWithUnknown,
      teacher_id,
    })

    await svc({
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
    })

    const aiCallArg = AIGenerateResponse.mock.calls[0][0]
    expect(aiCallArg.input).toEqual([
      { role: 'user', content: 'Hello teacher' },
    ])
  })
})
