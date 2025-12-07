'use client'

import { useEffect, useRef } from 'react'
import { useClassroom } from '../../contexts'
import { AudioMessage } from './audio.message'
import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'
import { Participant } from './base.props'
import { Replying } from './replying'

export interface Audio {
  id: string
  audio_id: string
  participant: Omit<Participant, 'role'> & { role: 'owner' | 'others' }
  transcription: string
  translation: string
}

const roles = {
  owner: AUDIO_MESSAGE_ROLE.OWNER,
  others: AUDIO_MESSAGE_ROLE.OTHERS,
}

const Audio = ({
  audio_id,
  participant,
  transcription,
  translation,
}: Audio) => {
  const ROLE = roles[participant.role]

  return (
    <AudioMessage
      participant={{
        ...participant,
        role: ROLE,
      }}
      audio_id={audio_id}
      transcription={transcription}
      translation={translation}
    />
  )
}

export const History = () => {
  const { history } = useClassroom()

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.scrollTop = el.scrollHeight
  })

  return (
    <div
      ref={ref}
      className="flex flex-col gap-3 items-center justify-start w-full max-w-screen-md pt-4 pb-[132px] overflow-y-auto h-[calc(100vh-76px)] no-scrollbar"
    >
      {history.map((audio, i) => (
        <Audio key={i.toString()} {...audio} />
      ))}
      <Replying />
    </div>
  )
}
