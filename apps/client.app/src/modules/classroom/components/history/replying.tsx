'use client'

import { useClassroom } from '../../contexts'
import { ReplyingMessage } from './replying.message'

export const Replying = () => {
  const { replying } = useClassroom()

  return (
    <div className="flex flex-col gap-3 items-center justify-start w-full max-w-screen-md">
      {replying && <ReplyingMessage participant={replying.participant} />}
    </div>
  )
}
