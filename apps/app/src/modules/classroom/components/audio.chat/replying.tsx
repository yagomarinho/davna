import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'
import { ReplyingMessage } from './replying.message'

export interface Replying {
  role: AUDIO_MESSAGE_ROLE
}

export interface ReplyingProps {
  replying?: Replying
}

export const Replying = ({ replying }: ReplyingProps) => (
  <div className="flex flex-col gap-3 items-center justify-start w-full max-w-screen-md">
    {replying && <ReplyingMessage role={replying.role} />}
  </div>
)
