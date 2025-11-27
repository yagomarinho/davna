import type { GPTModel } from '@davna/providers'
import { Handler, Identifier, isLeft, Repository, Response } from '@davna/core'

import { Audio } from '../entities/audio'
import { Message, MESSAGE_TYPE, messageSchema } from '../entities/message'
import { Classroom, PARTICIPANT_ROLE } from '../entities/classroom'

import { MessageHandler } from '../helpers/message.handler'

import { teacherGeneratesResponse } from '../services/teacher.generates.response'

import { Emitter } from '../helpers/emitter'

import { transcribeAndAppend } from '../services/transcribe.and.append'
import { remainingConsumption } from '../helpers/remaining.consumption'

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
  gpt: GPTModel
  messageHandler: MessageHandler
  storage: StorageConstructor
}

export const appendAndReplyHandler = Handler<Env, Data, Metadata>(
  request =>
    async ({
      audios,
      classrooms,
      emitter,
      messages,
      gpt,
      messageHandler,
      storage,
    }) => {
      const { classroom_id, participant_id, data } =
        await messageSchema.validate({
          ...request.data,
          participant_id: request.metadata.account.id,
        })

      const result = await transcribeAndAppend({
        audio: data as Audio,
        classroom_id,
        participant_id,
      })({
        audios,
        classrooms,
        messages,
        gpt,
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
        remainingConsumption: remainingConsumption(result.value.consume),
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
        gpt,
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
        remainingConsumption: remainingConsumption(result2.value.consume),
        classroom: updatedClassroom,
        message: IAMessage,
      })

      return Response.metadata({ status: 'successful' })
    },
)
