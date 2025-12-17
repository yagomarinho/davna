import { Left, Repository } from '@davna/core'
import { InMemoryRepository } from '@davna/infra'
import { STORAGE_TYPE } from '@davna/infra'

import { appendMessageToClassroom } from '../append.message.to.classroom'

import { Classroom } from '../../entities/classroom'
import { Message, MESSAGE_TYPE } from '../../entities/message'
import { Audio, SUPORTED_MIME_TYPE } from '../../entities/audio'

describe('appendMessageToClassroom service', () => {
  const classroomId = 'class-1'
  const participantId = 'user-1'
  const otherParticipantId = 'user-2'
  const audioId = 'audio-1'
  const internalRefId = 'ref-1'

  let audios: Repository<Audio>
  let classrooms: Repository<Classroom>
  let messages: Repository<Message>
  let storage: () => { check: jest.Mock }
  let messageHandler: jest.Mock

  beforeEach(async () => {
    audios = InMemoryRepository<Audio>()
    classrooms = InMemoryRepository<Classroom>()
    messages = InMemoryRepository<Message>()

    const classroomSeed: Classroom = {
      id: classroomId,
      participants: [{ participant_id: participantId, role: 'student' }],
      history: [],
    } as any

    await classrooms.set(classroomSeed)

    const check = jest.fn()

    storage = () => ({
      check,
    })

    messageHandler = jest.fn()

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return Left when classroom doesn't exist", async () => {
    const svc = appendMessageToClassroom({
      classroom_id: 'non-existent',
      participant_id: participantId,
      message_type: MESSAGE_TYPE.AUDIO,
      transcription: 't',
      translation: 'tr',
      data: Audio.create({
        id: 'audio_id',
        owner_id: 'owner_id',
        name: 'audio.name',
        src: 'some.src',
        duration: 3000,
        mime: SUPORTED_MIME_TYPE.OPUS,
        internal_ref: {
          identifier: 'internal_id',
          storage: STORAGE_TYPE.MONGO_GRIDFS,
        },
      }),
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      messageHandler: messageHandler as any,
      storage: storage as any,
    })

    expect(result).toEqual(
      Left({ status: 'error', message: 'No founded classroom' }),
    )
  })

  it('should return Left when participant is not part of the classroom', async () => {
    const svc = appendMessageToClassroom({
      classroom_id: classroomId,
      participant_id: otherParticipantId,
      message_type: MESSAGE_TYPE.AUDIO,
      transcription: 't',
      translation: 'tr',
      data: Audio.create({
        id: 'audio_id',
        owner_id: 'owner_id',
        name: 'audio.name',
        src: 'some.src',
        duration: 3000,
        mime: SUPORTED_MIME_TYPE.OPUS,
        internal_ref: {
          identifier: 'internal_id',
          storage: STORAGE_TYPE.MONGO_GRIDFS,
        },
      }),
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      messageHandler: messageHandler as any,
      storage: storage as any,
    })

    expect(result).toEqual(
      Left({
        status: 'error',
        message: `This classroom doesn't contains this participant: ${otherParticipantId}`,
      }),
    )
  })

  it("should return Left when message.data.id doesn't exist in audios repo", async () => {
    const producedMessage: Message = {
      id: 'msg-1',
      participant_id: participantId,
      data: { id: audioId, internal_ref: { identifier: internalRefId } },
      transcription: 't',
      translation: 'tr',
      type: 'audio' as any,
    } as any

    messageHandler.mockImplementation(() => async () => producedMessage)

    const svc = appendMessageToClassroom({
      classroom_id: classroomId,
      participant_id: participantId,
      message_type: MESSAGE_TYPE.AUDIO,
      transcription: 't',
      translation: 'tr',
      data: Audio.create({
        id: 'audio_id',
        owner_id: 'owner_id',
        name: 'audio.name',
        src: 'some.src',
        duration: 3000,
        mime: SUPORTED_MIME_TYPE.OPUS,
        internal_ref: {
          identifier: 'internal_id',
          storage: STORAGE_TYPE.MONGO_GRIDFS,
        },
      }),
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      messageHandler: messageHandler as any,
      storage: storage as any,
    })

    expect(result).toEqual(
      Left({
        status: 'error',
        message: `This data with id "${audioId}" doesn't exists`,
      }),
    )
  })

  it('should return Left when storage.check returns false (file missing)', async () => {
    await audios.set({ id: audioId } as any)

    const producedMessage: Message = {
      id: 'msg-1',
      participant_id: participantId,
      data: {
        id: audioId,
        internal_ref: {
          identifier: internalRefId,
          storage: STORAGE_TYPE.MONGO_GRIDFS,
        },
      },
      transcription: 't',
      translation: 'tr',
      type: 'audio' as any,
    } as any

    messageHandler.mockImplementation(() => async () => producedMessage)

    storage().check.mockResolvedValueOnce(false)

    const svc = appendMessageToClassroom({
      classroom_id: classroomId,
      participant_id: participantId,
      message_type: MESSAGE_TYPE.AUDIO,
      transcription: 't',
      translation: 'tr',
      data: {
        id: audioId,
        internal_ref: {
          identifier: internalRefId,
          storage: STORAGE_TYPE.MONGO_GRIDFS,
        },
      },
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      messageHandler: messageHandler as any,
      storage: storage as any,
    })

    expect(storage().check).toHaveBeenCalledTimes(1)
    expect(storage().check).toHaveBeenCalledWith(internalRefId)

    expect(result).toEqual(
      Left({
        status: 'error',
        message: `This file with id "${internalRefId}" doesn't exists`,
      }),
    )
  })

  it('should persist message and update classroom.history when everything is ok (Right)', async () => {
    await audios.set({ id: audioId } as any)
    storage().check.mockResolvedValueOnce(true)

    const producedMessage: Message = {
      id: 'msg-1',
      participant_id: participantId,
      data: { id: audioId, internal_ref: { identifier: internalRefId } },
      transcription: 't',
      translation: 'tr',
      type: 'audio' as any,
    } as any

    messageHandler.mockImplementation(() => async () => producedMessage)

    const svc = appendMessageToClassroom({
      classroom_id: classroomId,
      participant_id: participantId,
      message_type: MESSAGE_TYPE.AUDIO,
      transcription: 't',
      translation: 'tr',
      data: { some: 'payload' },
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      messageHandler: messageHandler as any,
      storage: storage as any,
    })

    expect(result).toEqual(expect.objectContaining({}))

    expect((result as any).isLeft).toBeFalsy()
    const value = (result as any).value

    expect(value.message).toBeDefined()
    expect(value.message.id).toBe(producedMessage.id)

    expect(value.classroom).toBeDefined()
    expect(Array.isArray(value.classroom.history)).toBeTruthy()
    expect(value.classroom.history).toContain(producedMessage.id)

    const storedMessage = await messages.get(producedMessage.id)
    expect(storedMessage).toBeDefined()
    expect(storedMessage!.id).toBe(producedMessage.id)

    const storedClass = await classrooms.get(classroomId)
    expect(storedClass).toBeDefined()
    expect(storedClass!.history).toContain(producedMessage.id)
  })
})
