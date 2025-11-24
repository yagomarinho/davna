'use client'

import { useState } from 'react'

import { BaseProps } from './base.props'
import { Base } from './base'
import { AudioContainer } from './audio.container'
import { Header } from './header'
import { Audio } from './audio'
import { Footer } from './footer'
import { Text } from './text'

export interface AudioMessageProps extends BaseProps {
  transcription: string
  translation: string
  audio_id: string
}

export const AudioMessage = ({
  role,
  transcription,
  translation,
  audio_id,
}: AudioMessageProps) => {
  const [textIsOpen, setTextIsOpen] = useState(false)

  function activeTextIsOpen(isActive: boolean) {
    setTextIsOpen(isActive)
  }

  return (
    <Base role={role}>
      <AudioContainer role={role}>
        <Header role={role} />
        <Audio id={audio_id} />
        <Footer role={role} onClick={activeTextIsOpen} />
      </AudioContainer>
      {textIsOpen && (
        <Text
          role={role}
          transcription={transcription}
          translation={translation}
        />
      )}
    </Base>
  )
}
