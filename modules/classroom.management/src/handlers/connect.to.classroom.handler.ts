/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { GPTModel, STORAGE_TYPE } from '@davna/providers'
import { Handler, Identifier, isLeft, Repository, Response } from '@davna/core'

import { Audio, Classroom, Message, PARTICIPANT_ROLE } from '../entities'
import { Emitter } from '../helpers/emitter'

import { teacherGeneratesResponse } from '../services/teacher.generates.response'

import { MessageHandler } from '../utils/message.handler'
import { remainingConsumption } from '../helpers/remaining.consumption'
import { StorageConstructor } from '../utils/storage'
import { MultimediaProvider } from '../providers'
import { showClassroom } from '../services/show.classroom'
import { verifyConsume } from '../services/verify.consume'

interface Metadata {
  account: Identifier
}

interface Data {
  classroom_id: string
  reply_strategy?: 'never' | 'always' | 'lax'
}

interface Env {
  emitter: Emitter
  audios: Repository<Audio>
  classrooms: Repository<Classroom>
  messages: Repository<Message>
  gpt: GPTModel
  multimedia: MultimediaProvider
  messageHandler: MessageHandler
  storage: StorageConstructor
  storage_driver: STORAGE_TYPE
}

export const connectToClassroomHandler = Handler<Env, Data, Metadata>(
  ({ data, metadata }) =>
    async ({
      emitter,
      audios,
      classrooms,
      messages,
      gpt,
      multimedia,
      messageHandler,
      storage,
      storage_driver,
    }) => {
      const { classroom_id, reply_strategy = 'lax' } = data
      const { account } = metadata

      const result = await showClassroom({
        classroom_id,
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

      const consume = await verifyConsume({
        classroom: { ...classroom, history: classroom.history.map(m => m.id) },
      })({ classrooms, messages })

      if (isLeft(consume)) {
        emitter.emit('error:service', {
          status: 'error',
          message: consume.value.message,
        })

        return Response.metadata({ status: 'error' })
      }

      emitter.emit('classroom:started', {
        remainingConsumption: remainingConsumption(consume.value.consume),
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

      if (
        reply_strategy === 'always' ||
        (reply_strategy === 'lax' && !classroom.history.length)
      ) {
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
          multimedia,
          messageHandler,
          storage,
          storage_driver,
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
      }

      return Response.metadata({ status: 'successful' })
    },
)
