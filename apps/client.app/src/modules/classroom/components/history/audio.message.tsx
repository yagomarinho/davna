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
  audio_id: string
  transcription: string
  translation: string
}

export const AudioMessage = ({
  participant,
  transcription,
  translation,
  audio_id,
}: AudioMessageProps) => {
  const [textIsOpen, setTextIsOpen] = useState(false)

  function activeTextIsOpen(isActive: boolean) {
    setTextIsOpen(isActive)
  }

  return (
    <Base participant={participant}>
      <AudioContainer participant={participant}>
        <Header participant={participant} />
        <Audio id={audio_id} participant={participant} />
        <Footer participant={participant} onClick={activeTextIsOpen} />
      </AudioContainer>
      {textIsOpen && (
        <Text
          participant={participant}
          transcription={transcription}
          translation={translation}
        />
      )}
    </Base>
  )
}
