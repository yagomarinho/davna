import { Repository } from '../../../shared/core/repository'

import { Message, MESSAGE_TYPE } from '../entities/message'
import { Classroom } from '../entities/classroom'
import { Audio } from '../entities/audio'

import { MessageHandler } from '../providers/message.handler'
import { StorageConstructor } from '../../../shared/providers/storage/storage'

import { appendMessageToClassroom } from './append.message.to.classroom'
import { Service } from '../../../shared/core/service'
import { getTranscriptionFromAudio } from '../utils/get.transcription.from.audio'
import { verifyConsume } from './verify.consume'
import { isLeft, Left, Right } from '../../../shared/core/either'

interface Data {
  audio: Audio
  classroom_id: string
  participant_id: string
}

interface Env {
  audios: Repository<Audio>
  classrooms: Repository<Classroom>
  messages: Repository<Message>
  messageHandler: MessageHandler
  storage: StorageConstructor
}

interface Response {
  consume: number
  classroom: Classroom
  message: Message
}

export const transcribeAndAppend = Service<Data, Env, Response>(
  ({ audio, classroom_id, participant_id }) =>
    async ({ audios, classrooms, messages, messageHandler, storage }) => {
      const classroom = await classrooms.get(classroom_id)

      if (!classroom)
        return Left({ status: 'error', message: 'Invalid classroom id' })

      const result = await verifyConsume({ classroom })({
        classrooms,
        messages,
      })

      if (isLeft(result)) return result

      const transcriptionResult = await getTranscriptionFromAudio(audio.id)({
        audios,
        storage,
      })

      const { transcription, translation } = transcriptionResult

      const result2 = await appendMessageToClassroom({
        classroom_id: classroom_id,
        participant_id,
        message_type: MESSAGE_TYPE.AUDIO,
        transcription,
        translation,
        data: audio,
      })({
        audios,
        classrooms,
        messages,
        messageHandler,
        storage,
      })

      if (isLeft(result2)) return result2

      return Right({
        consume: result.value.consume,
        classroom: result2.value.classroom,
        message: result2.value.message,
      })
    },
)
