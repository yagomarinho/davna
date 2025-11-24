import { isLeft } from '../../../shared/core/either'
import { Classroom, PARTICIPANT_ROLE } from '../entities/classroom'
import { Handler } from '../../../shared/core/handler'
import { Emitter } from '../helpers/emitter'
import { Identifier } from '../../../shared/core/entity'
import { Response } from '../../../shared/core/response'
import { openClassroom } from '../services/open.classroom'
import { Repository } from '../../../shared/core/repository'
import { teacherGeneratesResponse } from '../services/teacher.generates.response'
import { Audio } from '../entities/audio'
import { Message } from '../entities/message'
import { MessageHandler } from '../providers/message.handler'
import { StorageConstructor } from '../../../shared/providers/storage/storage'

interface Metadata {
  account: Identifier
}

interface Env {
  emitter: Emitter
  audios: Repository<Audio>
  classrooms: Repository<Classroom>
  messages: Repository<Message>
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
      messageHandler,
      storage,
    }) => {
      const { account } = metadata

      const result = await openClassroom({
        participant_id: account.id,
      })({ classrooms })

      if (isLeft(result)) {
        emitter.emit('error:service', {
          status: 'error',
          message: result.value.message,
        })

        return Response.metadata({ status: 'error' })
      }

      const classroom = result.value

      emitter.emit('classroom:started', classroom)

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

      const { classroom: updatedClassroom, message } = result2.value

      emitter.emit('classroom:updated', {
        classroom: updatedClassroom,
        message,
      })

      return Response.metadata({ status: 'successful' })
    },
)
