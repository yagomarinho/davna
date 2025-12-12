'use client'

import { BaseProps } from './base.props'
import { Base } from './base'
import { AudioContainer } from './audio.container'
import { Header } from './header'
import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'

export interface ReplyingMessageProps extends BaseProps {}

export const ReplyingMessage = ({ participant }: ReplyingMessageProps) => (
  <Base participant={participant}>
    <AudioContainer participant={participant}>
      <Header participant={participant} />
      <p className="font-roboto text-sm md:text-base leading-[150%]">
        {participant.role === AUDIO_MESSAGE_ROLE.OTHERS
          ? 'Gravando Resposta...'
          : 'Processando Áudio...'}
      </p>
    </AudioContainer>
  </Base>
)
