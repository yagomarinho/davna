import { Result } from '../../../shared/core/result'
import { Audio, audioSchema } from '../entities/audio'
import { AudioMessage, Message, MESSAGE_TYPE } from '../entities/message'

export interface HandlerInit {
  classroom_id: string
  participant_id: string
  message_type: string
  transcription: string
  translation: string
}

export interface MessageHandler {
  (init: HandlerInit): Result<unknown, Message>
}

export const MessageHandler: MessageHandler =
  ({
    classroom_id,
    message_type,
    participant_id,
    transcription,
    translation,
  }) =>
  async data => {
    if (message_type !== MESSAGE_TYPE.AUDIO)
      throw new Error('Invalid data to convert')

    return AudioMessage.create({
      classroom_id,
      participant_id,
      type: message_type,
      data: Audio.create(await audioSchema.validate(data)),
      transcription,
      translation,
    })
  }
