import { isLeft } from '../../../shared/core/either'

import { Repository } from '../../../shared/core/repository'
import { Handler } from '../../../shared/core/handler'

import { Audio } from '../entities/audio'
import { Message, MESSAGE_TYPE, messageSchema } from '../entities/message'
import { Classroom, PARTICIPANT_ROLE } from '../entities/classroom'

import { MessageHandler } from '../providers/message.handler'
import { StorageConstructor } from '../../../shared/providers/storage/storage'

import { appendMessageToClassroom } from '../services/append.message.to.classroom'
import { teacherGeneratesResponse } from '../services/teacher.generates.response'

import { Emitter } from '../helpers/emitter'
import { getTranscriptionFromAudio } from '../utils/get.transcription.from.audio'
import { Response } from '../../../shared/core/response'
import { Identifier } from '../../../shared/core/entity'

interface Metadata {
  account: Identifier
}

interface Data {
  classroom_id: string
  type: MESSAGE_TYPE
  data: unknown
}

interface Env {
  emitter: Emitter
  audios: Repository<Audio>
  classrooms: Repository<Classroom>
  messages: Repository<Message>
  messageHandler: MessageHandler
  storage: StorageConstructor
}

export const appendAndReplyHandler = Handler<Env, Data, Metadata>(
  request =>
    async ({
      audios,
      classrooms,
      emitter,
      messageHandler,
      messages,
      storage,
    }) => {
      const { classroom_id, participant_id, type, data } =
        await messageSchema.validate({
          ...request.data,
          participant_id: request.metadata.account.id,
        })

      const transcriptionResult = await getTranscriptionFromAudio(
        (data as any).id,
      )({
        audios,
        storage,
      })

      if (!transcriptionResult) {
        emitter.emit('error:service', {
          status: 'error',
          message: 'Invalid Audio Id',
        })

        return Response.metadata({ status: 'error' })
      }

      const { transcription, translation } = transcriptionResult

      const result = await appendMessageToClassroom({
        classroom_id,
        participant_id,
        message_type: type,
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

      if (isLeft(result)) {
        emitter.emit('error:service', {
          status: 'error',
          message: result.value.message,
        })

        return Response.metadata({ status: 'error' })
      }

      const { classroom, message } = result.value

      emitter.emit('classroom:updated', {
        classroom,
        message,
      })

      const teacher_id = classroom.participants.find(
        p => p.role === PARTICIPANT_ROLE.TEACHER,
      )?.participant_id

      if (!teacher_id) {
        emitter.emit('error:internal', {
          status: 'error',
          message: 'Internal Server Error',
        })

        return Response.metadata({ status: 'error' })
      }

      emitter.emit('classroom:replying', {
        classroom_id: classroom.id,
        participant_id: teacher_id,
      })

      const result2 = await teacherGeneratesResponse({
        classroom,
        teacher_id,
      })({
        audios,
        classrooms,
        messages,
        messageHandler,
        storage,
      })

      if (isLeft(result2)) {
        emitter.emit('error:service', {
          status: 'error',
          message: result2.value.message,
        })

        return Response.metadata({ status: 'error' })
      }

      const { classroom: updatedClassroom, message: IAMessage } = result2.value

      emitter.emit('classroom:updated', {
        classroom: updatedClassroom,
        message: IAMessage,
      })

      return Response.metadata({ status: 'successful' })
    },
)
