import { Left, Repository, Right } from '@davna/core'
import { InMemoryRepository } from '@davna/repositories'
import { FakeAI, STORAGE_TYPE } from '@davna/providers'

import { AIGenerateResponse as AIGenerateResponseService } from '../../helpers/ai.generate.response'
import { appendMessageToClassroom as appendMessageService } from '../append.message.to.classroom'
import { verifyConsume as verifyConsumeService } from '../verify.consume'

import { Message, MESSAGE_TYPE } from '../../entities/message'
import { Classroom } from '../../entities/classroom'
import { Audio } from '../../entities/audio'
import { teacherGeneratesResponse } from '../teacher.generates.response'

jest.mock('../../helpers/ai.generate.response', () => ({
  AIGenerateResponse: jest.fn(),
}))

jest.mock('../append.message.to.classroom', () => ({
  appendMessageToClassroom: jest.fn(),
}))

jest.mock('../verify.consume', () => ({
  verifyConsume: jest.fn(),
}))

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn(),
  rm: jest.fn(),
}))

const AIGenerateResponse = AIGenerateResponseService as unknown as jest.Mock
const appendMessageToClassroom = appendMessageService as unknown as jest.Mock
const verifyConsume = verifyConsumeService as unknown as jest.Mock

describe('teacherGeneratesResponse (service) - updated behavior', () => {
  let messages: Repository<Message>
  let classrooms: Repository<Classroom>
  let audios: Repository<Audio>
  let storage: any
  let messageHandler: any
  let multimedia: any
  const storage_driver = STORAGE_TYPE.MONGO_GRIDFS
  const gpt = FakeAI({
    textToRespond: 'to respond',
    pathToSpeech: '/path',
    textFromSpeech: 'from speech',
  })

  const teacher_id = 'teacher-1'
  const student_id = 'student-1'

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

  const classroom: Omit<Classroom, 'history'> & { history: Message[] } = {
    id: 'class-1',
    participants: [
      { participant_id: student_id, role: 'student' },
      { participant_id: teacher_id, role: 'teacher' },
    ],
    history: [messagesSeed[0], messagesSeed[1]],
  } as any

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
    multimedia = { metadata: jest.fn(), convert: jest.fn() }

    await classrooms.set({
      ...classroom,
      history: classroom.history.map(m => m.id),
    })
    for (const m of messagesSeed) await messages.set(m)

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call verifyConsume, call AI with mapped history and forward result to appendMessageToClassroom (happy path)', async () => {
    // verifyConsume returns Right with consume
    const consumePayload = { consume: 12 }
    verifyConsume.mockImplementationOnce(
      () => async () => Right(consumePayload),
    )

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

    const mnew = {
      id: 'm-new',
      participant_id: teacher_id,
      type: MESSAGE_TYPE.AUDIO,
      data: {
        duration: 10,
      },
    } as any

    const appendReturn = Right({
      classroom: {
        ...classroom,
        history: classroom.history.concat(mnew).map(m => m.id),
      },
      message: mnew,
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
      gpt,
      multimedia,
      messageHandler,
      storage,
      storage_driver,
    })

    expect(verifyConsume).toHaveBeenCalledTimes(1)

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

    // final result should include consume from verifyConsume and values from appendReturn
    expect(result).toEqual(
      Right({
        consume:
          consumePayload.consume + appendReturn.value.message.data.duration,
        classroom: appendReturn.value.classroom,
        message: appendReturn.value.message,
      }),
    )
  })

  it('should forward Left from verifyConsume (stop before AI)', async () => {
    const errorPayload = { status: 'error', message: 'cannot consume' }
    verifyConsume.mockImplementationOnce(() => async () => Left(errorPayload))

    const svc = teacherGeneratesResponse({
      classroom,
      teacher_id,
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      gpt,
      multimedia,
      messageHandler,
      storage,
      storage_driver,
    })

    expect(verifyConsume).toHaveBeenCalledTimes(1)
    expect(AIGenerateResponse).not.toHaveBeenCalled()
    expect(appendMessageToClassroom).not.toHaveBeenCalled()

    expect(result).toEqual(Left(errorPayload))
  })

  it('should forward Left from appendMessageToClassroom (AI ok but append fails)', async () => {
    verifyConsume.mockImplementationOnce(
      () => async () => Right({ consume: 0 }),
    )

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
      gpt,
      multimedia,
      messageHandler,
      storage,
      storage_driver,
    })

    expect(appendMessageToClassroom).toHaveBeenCalledTimes(1)

    expect(result).toEqual(Left(errorPayload))
  })

  it('should reject if AIGenerateResponse throws', async () => {
    verifyConsume.mockImplementationOnce(
      () => async () => Right({ consume: 0 }),
    )

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
        gpt,
        multimedia,
        messageHandler,
        storage,
        storage_driver,
      }),
    ).rejects.toThrow('AI failure')

    expect(appendMessageToClassroom).not.toHaveBeenCalled()
  })
})
