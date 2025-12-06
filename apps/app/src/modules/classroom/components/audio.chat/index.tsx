import { AudioMessage } from './audio.message'
import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'

export interface Audio {
  id: string
  audio_id: string
  role: 'teacher' | 'student'
  transcription: string
  translation: string
}

const roles = {
  teacher: AUDIO_MESSAGE_ROLE.TEACHER,
  student: AUDIO_MESSAGE_ROLE.STUDENT,
}

const Audio = ({ audio_id, role, transcription, translation }: Audio) => {
  const ROLE = roles[role]

  return (
    <AudioMessage
      audio_id={audio_id}
      role={ROLE}
      transcription={transcription}
      translation={translation}
    />
  )
}

export const AudioChat = ({ messages }: { messages: Audio[] }) => (
  <div className="flex flex-col gap-3 items-center justify-start w-full max-w-screen-md">
    {messages.map((message, i) => (
      <Audio key={i.toString()} {...message} />
    ))}
  </div>
)
