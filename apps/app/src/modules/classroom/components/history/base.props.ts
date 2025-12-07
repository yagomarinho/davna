import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'

export interface Participant {
  participant_id: string
  name: string
  role: AUDIO_MESSAGE_ROLE
}
export interface BaseProps {
  participant: Participant
}
