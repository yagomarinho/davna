import type { GPTModel } from '@davna/providers'
import { Handler, Identifier, isLeft, Repository, Response } from '@davna/core'

import { Audio, Classroom, Message, PARTICIPANT_ROLE } from '../entities'
import { Emitter } from '../helpers/emitter'

import { openClassroom } from '../services/open.classroom'
import { teacherGeneratesResponse } from '../services/teacher.generates.response'

import { MessageHandler } from '../utils/message.handler'
import { remainingConsumption } from '../helpers/remaining.consumption'
import { StorageConstructor } from '../utils/storage'

interface Metadata {
  account: Identifier
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

export const initializeClassroomHandler = Handler<Env, any, Metadata>(
  ({ metadata }) =>
    async ({
      emitter,
      audios,
      classrooms,
      messages,
      gpt,
      messageHandler,
      storage,
    }) => {
      const { account } = metadata

      const result = await openClassroom({
        participant_id: account.id,
      })({ classrooms, messages })

      if (isLeft(result)) {
        emitter.emit('error:service', {
          status: 'error',
          message: result.value.message,
        })

        return Response.metadata({ status: 'error' })
      }

      const { classroom } = result.value

      emitter.emit('classroom:started', {
        remainingConsumption: remainingConsumption(result.value.consume),
        classroom,
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

      const { classroom: updatedClassroom, message } = result2.value

      emitter.emit('classroom:updated', {
        remainingConsumption: remainingConsumption(result2.value.consume),
        classroom: updatedClassroom,
        message,
      })

      return Response.metadata({ status: 'successful' })
    },
)
