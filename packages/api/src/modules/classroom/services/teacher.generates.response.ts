import { Query, Repository } from '../../../shared/core/repository'

import { Message, MESSAGE_TYPE } from '../entities/message'
import { Classroom } from '../entities/classroom'
import { Audio } from '../entities/audio'

import { MessageHandler } from '../providers/message.handler'
import { StorageConstructor } from '../../../shared/providers/storage/storage'

import { AIGenerateResponse } from '../utils/ai.generate.response'
import { appendMessageToClassroom } from './append.message.to.classroom'
import { Service } from '../../../shared/core/service'
import { isLeft, Right } from '../../../shared/core/either'
import { verifyConsume } from './verify.consume'

interface Data {
  classroom: Classroom
  teacher_id: string
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

export const teacherGeneratesResponse = Service<Data, Env, Response>(
  ({ classroom, teacher_id }) =>
    async ({ audios, classrooms, messages, messageHandler, storage }) => {
      const result = await verifyConsume({ classroom })({
        classrooms,
        messages,
      })

      if (isLeft(result)) return result

      // pegar o histórico e montar o input do GPT
      const { history, participants } = classroom

      const h = await messages.query(Query.where('id', 'in', history))

      const input = h
        .map(m => {
          let role: string | undefined = participants.find(
            p => p.participant_id === m.participant_id,
          )?.role

          if (!role) return

          role = role === 'student' ? 'user' : 'assistant'

          return {
            role,
            content: m.transcription,
          }
        })
        .filter(Boolean) as any

      const AIResult = await AIGenerateResponse({ input })({
        storage,
        audios,
      })

      const { audio: data, transcription, translation } = AIResult

      const result2 = await appendMessageToClassroom({
        classroom_id: classroom.id,
        participant_id: teacher_id,
        message_type: MESSAGE_TYPE.AUDIO,
        transcription,
        translation,
        data,
      })({
        audios,
        classrooms,
        messages,
        messageHandler,
        storage,
      })

      if (isLeft(result2)) return result2

      const { classroom: c, message: m } = result2.value

      return Right({
        consume: result.value.consume + result2.value.message.data.duration,
        classroom: c,
        message: m,
      })
    },
)
