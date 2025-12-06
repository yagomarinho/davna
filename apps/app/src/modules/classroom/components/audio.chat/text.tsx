'use client'

import { useState } from 'react'

import { Button } from '@/shared/components'

import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'
import { BaseProps } from './base.props'

enum TEXT_MODE {
  TRANSCRIPTION,
  TRANSLATION,
}

export interface TextComponentProps extends BaseProps {
  transcription: string
  translation: string
}

export const Text = ({
  transcription,
  translation,
  role,
}: TextComponentProps) => {
  const styles = {
    [AUDIO_MESSAGE_ROLE.TEACHER]: { backgroundColor: '#202020' },
    [AUDIO_MESSAGE_ROLE.STUDENT]: { backgroundColor: '#2A3345' },
  }

  const [mode, setMode] = useState(TEXT_MODE.TRANSCRIPTION)

  function toggleMode() {
    setMode(actual =>
      actual === TEXT_MODE.TRANSCRIPTION
        ? TEXT_MODE.TRANSLATION
        : TEXT_MODE.TRANSCRIPTION,
    )
  }

  return (
    <div
      style={styles[role]}
      className="flex flex-col justify-start items-start w-full rounded-lg p-2"
    >
      <p className="font-roboto text-xs text-[#C2C2C2] p-2">
        {mode === TEXT_MODE.TRANSCRIPTION ? transcription : translation}
      </p>
      <Button type="ghost" onClick={toggleMode}>
        <span className="font-roboto text-xs leading-[1.5] text-[#FFFFFF]">
          {mode === TEXT_MODE.TRANSLATION ? 'Ver transcrição' : 'Ver tradução'}
        </span>
      </Button>
    </div>
  )
}
