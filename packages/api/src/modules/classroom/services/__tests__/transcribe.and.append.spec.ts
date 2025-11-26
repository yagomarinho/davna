import { Left, Right } from '../../../../shared/core/either'
import { Repository } from '../../../../shared/core/repository'
import { InMemoryRepository } from '../../../../shared/repositories/in.memory.repository'
import { Audio } from '../../entities/audio'
import { Classroom } from '../../entities/classroom'
import { Message, MESSAGE_TYPE } from '../../entities/message'
import { getTranscriptionFromAudio as getTranscriptionFromAudioService } from '../../utils/get.transcription.from.audio'
import { appendMessageToClassroom as appendMessageToClassroomService } from '../append.message.to.classroom'
import { verifyConsume as verifyConsumeService } from '../verify.consume'
import { transcribeAndAppend } from '../transcribe.and.append'

jest.mock('../../utils/get.transcription.from.audio', () => ({
  getTranscriptionFromAudio: jest.fn(),
}))

jest.mock('../append.message.to.classroom', () => ({
  appendMessageToClassroom: jest.fn(),
}))

jest.mock('../verify.consume', () => ({
  verifyConsume: jest.fn(),
}))

const getTranscriptionFromAudio =
  getTranscriptionFromAudioService as unknown as jest.Mock
const appendMessageToClassroom =
  appendMessageToClassroomService as unknown as jest.Mock
const verifyConsume = verifyConsumeService as unknown as jest.Mock

describe('transcribeAndAppend (service) - updated behavior', () => {
  let audios: Repository<Audio>
  let classrooms: Repository<Classroom>
  let messages: Repository<Message>
  let storage: any
  let messageHandler: any

  const classroom_id = 'class-1'
  const participant_id = 'participant-1'

  const audio: Audio = {
    id: 'audio-1',
    path: 'some/path',
    size: 123,
  } as any

  const classroom: Classroom = {
    id: classroom_id,
    participants: [{ participant_id, role: 'student' }],
    history: [],
  } as any

  beforeEach(async () => {
    audios = InMemoryRepository<Audio>()
    classrooms = InMemoryRepository<Classroom>()
    messages = InMemoryRepository<Message>()

    storage = () => ({
      download: jest.fn(),
      upload: jest.fn(),
      check: jest.fn(),
    })

    messageHandler = { process: jest.fn() }

    await audios.set(audio)
    await classrooms.set(classroom)

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return Left when classroom id is invalid', async () => {
    // remove classroom so get returns undefined
    classrooms = InMemoryRepository<Classroom>()

    const svc = transcribeAndAppend({
      audio,
      classroom_id,
      participant_id,
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
    })

    expect(result).toEqual(
      Left({ status: 'error', message: 'Invalid classroom id' }),
    )

    expect(verifyConsume).not.toHaveBeenCalled()
    expect(getTranscriptionFromAudio).not.toHaveBeenCalled()
    expect(appendMessageToClassroom).not.toHaveBeenCalled()
  })

  it('should forward Left from verifyConsume (stop before transcription)', async () => {
    verifyConsume.mockImplementationOnce(
      () => async () => Left({ status: 'error', message: 'cannot consume' }),
    )

    const svc = transcribeAndAppend({
      audio,
      classroom_id,
      participant_id,
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
    })

    expect(verifyConsume).toHaveBeenCalledTimes(1)
    expect(getTranscriptionFromAudio).not.toHaveBeenCalled()
    expect(appendMessageToClassroom).not.toHaveBeenCalled()

    expect(result).toEqual(Left({ status: 'error', message: 'cannot consume' }))
  })

  it('should call getTranscriptionFromAudio, call appendMessageToClassroom and return Right with consume and appended values (happy path)', async () => {
    // verifyConsume returns Right with consume
    const consumePayload = { consume: 123 }
    verifyConsume.mockImplementationOnce(
      () => async () => Right(consumePayload),
    )

    const transcriptionResult = {
      transcription: 'Transcribed text',
      translation: 'Texto transcrito',
      // other fields if any...
    }

    getTranscriptionFromAudio.mockImplementationOnce(
      () => async () => transcriptionResult,
    )

    const appendReturn = Right({
      classroom: { ...classroom, history: ['m-new'] },
      message: {
        id: 'm-new',
        participant_id,
        type: MESSAGE_TYPE.AUDIO,
      } as any,
    })

    appendMessageToClassroom.mockImplementationOnce(
      () => async () => appendReturn,
    )

    const svc = transcribeAndAppend({
      audio,
      classroom_id,
      participant_id,
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
    })

    expect(verifyConsume).toHaveBeenCalledTimes(1)

    expect(getTranscriptionFromAudio).toHaveBeenCalledTimes(1)
    const gtCallArg = getTranscriptionFromAudio.mock.calls[0][0]
    expect(gtCallArg).toBe(audio.id)

    expect(appendMessageToClassroom).toHaveBeenCalledTimes(1)
    const appendCallArg = appendMessageToClassroom.mock.calls[0][0]
    expect(appendCallArg).toEqual(
      expect.objectContaining({
        classroom_id,
        participant_id,
        message_type: MESSAGE_TYPE.AUDIO,
        transcription: transcriptionResult.transcription,
        translation: transcriptionResult.translation,
        data: audio,
      }),
    )

    expect(result).toEqual(
      Right({
        consume: consumePayload.consume,
        classroom: appendReturn.value.classroom,
        message: appendReturn.value.message,
      }),
    )
  })

  it('should forward Left from appendMessageToClassroom (after transcription)', async () => {
    verifyConsume.mockImplementationOnce(
      () => async () => Right({ consume: 0 }),
    )

    const transcriptionResult = {
      transcription: 'Transcribed text',
      translation: 'Texto transcrito',
    }

    getTranscriptionFromAudio.mockImplementationOnce(
      () => async () => transcriptionResult,
    )

    const errorPayload = { status: 'error', message: 'cannot append' }
    appendMessageToClassroom.mockImplementationOnce(
      () => async () => Left(errorPayload),
    )

    const svc = transcribeAndAppend({
      audio,
      classroom_id,
      participant_id,
    })

    const result = await svc({
      audios,
      classrooms,
      messages,
      messageHandler,
      storage,
    })

    expect(getTranscriptionFromAudio).toHaveBeenCalledTimes(1)
    expect(appendMessageToClassroom).toHaveBeenCalledTimes(1)

    expect(result).toEqual(Left(errorPayload))
  })

  it('should reject if getTranscriptionFromAudio throws', async () => {
    verifyConsume.mockImplementationOnce(
      () => async () => Right({ consume: 0 }),
    )

    getTranscriptionFromAudio.mockImplementationOnce(() => async () => {
      throw new Error('Transcription failure')
    })

    const svc = transcribeAndAppend({
      audio,
      classroom_id,
      participant_id,
    })

    await expect(
      svc({
        audios,
        classrooms,
        messages,
        messageHandler,
        storage,
      }),
    ).rejects.toThrow('Transcription failure')

    expect(appendMessageToClassroom).not.toHaveBeenCalled()
  })
})
