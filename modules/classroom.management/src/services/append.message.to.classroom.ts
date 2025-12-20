/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Left, Repository, Right, Service } from '@davna/core'

import { MessageHandler } from '../utils/message.handler'
import { StorageConstructor } from '../utils/storage'
import { FederatedRepository } from '@davna/infra'

interface Request {
  classroom_id: string
  participant_id: string
  message_type: string
  transcription: string
  translation: string
  data: unknown
}

interface Env {
  repo: FederatedRepository<[], ''>
  messageHandler: MessageHandler
  storage: StorageConstructor
}

interface Response {
  classroom: Classroom
  message: Message
}

export const appendMessageToClassroom = Service<Request, Env, Response>(
  ({
    classroom_id,
    participant_id,
    message_type,
    transcription,
    translation,
    data,
  }) =>
    async ({ graph, messageHandler, storage }) => {
      let classroom = await classrooms.get(classroom_id)

      if (!classroom)
        return Left({ status: 'error', message: 'No founded classroom' })

      if (
        !classroom.participants
          .map(participant => participant.participant_id)
          .includes(participant_id)
      )
        return Left({
          status: 'error',
          message: `This classroom doesn't contains this participant: ${participant_id}`,
        })

      // Verificar os gastos do participant aqui ?

      let message = await messageHandler({
        classroom_id,
        participant_id,
        message_type,
        transcription,
        translation,
      })(data)

      // verificar se o áudio realmente existe
      const dataExists = await audios.get(message.data.id)

      if (!dataExists)
        return Left({
          status: 'error',
          message: `This data with id "${message.data.id}" doesn't exists`,
        })

      const bufferExists = await storage({
        driver: message.data.internal_ref.storage,
      }).check(message.data.internal_ref.identifier)

      if (!bufferExists)
        return Left({
          status: 'error',
          message: `This file with id "${message.data.internal_ref.identifier}" doesn't exists`,
        })

      // Aqui é hora de construir uma transaction
      message = await messages.set(message)
      classroom = await classrooms.set(
        Classroom.create({
          ...classroom,
          history: classroom.history.concat(message.id),
        }),
      )

      return Right({
        classroom,
        message,
      })
    },
)
