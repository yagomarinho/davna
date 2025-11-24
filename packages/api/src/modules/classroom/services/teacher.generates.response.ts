import { Query, Repository } from '../../../shared/core/repository'

import { Message, MESSAGE_TYPE } from '../entities/message'
import { Classroom } from '../entities/classroom'
import { Audio } from '../entities/audio'

import { MessageHandler } from '../providers/message.handler'
import { StorageConstructor } from '../../../shared/providers/storage/storage'

import { AIGenerateResponse } from '../utils/ai.generate.response'
import { appendMessageToClassroom } from './append.message.to.classroom'
import { Service } from '../../../shared/core/service'

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
  classroom: Classroom
  message: Message
}

export const teacherGeneratesResponse = Service<Data, Env, Response>(
  ({ classroom, teacher_id }) =>
    async ({ audios, classrooms, messages, messageHandler, storage }) => {
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

      return appendMessageToClassroom({
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
    },
)
