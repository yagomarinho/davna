import { object, string } from 'yup'
import { applyTag, Entity } from '@davna/core'

import { Audio, audioSchema } from './audio'

const URI = 'message'
type URI = typeof URI

export enum MESSAGE_TYPE {
  AUDIO = 'audio',
}

export type SUPPORTED_DATA_TYPE = Audio

export interface AudioMessageProps {
  classroom_id: string
  participant_id: string
  type: MESSAGE_TYPE.AUDIO
  data: Audio // duplicação de dados (resolver no futuro)
  transcription: string
  translation: string
}

export interface AudioMessage extends AudioMessageProps, Entity<URI> {}

export interface CreateAudioMessage
  extends AudioMessageProps,
    Partial<Entity> {}

export type Message = AudioMessage

export const messageSchema = object({
  classroom_id: string().required(),
  participant_id: string().required(),
  type: string<MESSAGE_TYPE>().oneOf(Object.values(MESSAGE_TYPE)).required(),
  data: audioSchema.required(),
  transcription: string(),
  translation: string(),
})

export function AudioMessage(
  id: string,
  classroom_id: string,
  participant_id: string,
  type: MESSAGE_TYPE,
  data: Audio,
  transcription: string,
  translation: string,
  created_at: Date,
  updated_at: Date,
): AudioMessage {
  return applyTag(URI)({
    id,
    classroom_id,
    participant_id,
    type,
    data,
    transcription,
    translation,
    created_at,
    updated_at,
  })
}

AudioMessage.create = ({
  id = '',
  classroom_id,
  participant_id,
  type,
  data,
  transcription,
  translation,
  created_at,
  updated_at,
}: CreateAudioMessage) => {
  const now = new Date()

  return AudioMessage(
    id,
    classroom_id,
    participant_id,
    type,
    data,
    transcription,
    translation,
    created_at ?? now,
    updated_at ?? now,
  )
}
