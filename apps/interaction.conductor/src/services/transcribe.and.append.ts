/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isLeft, Left, Repository, Right, Service } from '@davna/core'
import { GPTModel } from '@davna/providers'

interface Data {
  audio: Audio
  classroom_id: string
  participant_id: string
}

interface Env {
  audios: Repository<Audio>
  classrooms: Repository<Classroom>
  messages: Repository<Message>
  gpt: GPTModel
  messageHandler: MessageHandler
  storage: StorageConstructor
  tempDir: string
}

interface Response {
  consume: number
  classroom: Classroom
  message: Message
}

export const transcribeAndAppend = Service<Data, Env, Response>(
  ({ audio, classroom_id, participant_id }) =>
    async ({
      audios,
      classrooms,
      messages,
      gpt,
      messageHandler,
      storage,
      tempDir,
    }) => {
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
        gpt,
        tempDir,
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
        consume: result.value.consume + result2.value.message.data.duration,
        classroom: result2.value.classroom,
        message: result2.value.message,
      })
    },
)
