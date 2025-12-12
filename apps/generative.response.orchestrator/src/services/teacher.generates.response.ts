import { isLeft, Repository, Right, Service } from '@davna/core'
import { GPTModel, STORAGE_TYPE } from '@davna/providers'

interface Data {
  classroom: Omit<Classroom, 'history'> & { history: Message[] }
  teacher_id: string
}

interface Env {
  audios: Repository<Audio>
  classrooms: Repository<Classroom>
  messages: Repository<Message>
  gpt: GPTModel
  messageHandler: MessageHandler
  multimedia: MultimediaProvider
  storage: StorageConstructor
  storage_driver: STORAGE_TYPE
}

interface Response {
  consume: number
  classroom: Classroom
  message: Message
}

export const teacherGeneratesResponse = Service<Data, Env, Response>(
  ({ classroom, teacher_id }) =>
    async ({
      audios,
      classrooms,
      messages,
      gpt,
      messageHandler,
      multimedia,
      storage,
      storage_driver,
    }) => {
      const result = await verifyConsume({
        classroom: { ...classroom, history: classroom.history.map(m => m.id) },
      })({
        classrooms,
        messages,
      })

      if (isLeft(result)) return result

      // pegar o histórico e montar o input do GPT
      const { history, participants } = classroom

      const input = history
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
        gpt,
        multimedia,
        storage_driver,
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
