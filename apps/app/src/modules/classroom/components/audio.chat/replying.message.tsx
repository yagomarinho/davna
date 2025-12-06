'use client'

import { BaseProps } from './base.props'
import { Base } from './base'
import { AudioContainer } from './audio.container'
import { Header } from './header'
import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'

export interface ReplyingMessageProps extends BaseProps {}

export const ReplyingMessage = ({ role }: ReplyingMessageProps) => (
  <Base role={role}>
    <AudioContainer role={role}>
      <Header role={role} />
      <p className="font-roboto text-sm md:text-base leading-[150%]">
        {role === AUDIO_MESSAGE_ROLE.TEACHER
          ? 'Gravando Resposta...'
          : 'Processando Áudio...'}
      </p>
    </AudioContainer>
  </Base>
)
