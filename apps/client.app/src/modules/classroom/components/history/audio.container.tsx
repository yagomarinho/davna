import { PropsWithChildren } from 'react'
import { BaseProps } from './base.props'
import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'

export const AudioContainer = ({
  participant,
  children,
}: PropsWithChildren<BaseProps>) => {
  const styles = {
    [AUDIO_MESSAGE_ROLE.OTHERS]: {
      backgroundColor: '#202020',
      borderRadius: '8px',
    },
    [AUDIO_MESSAGE_ROLE.OWNER]: {
      backgroundColor: '#2A3345',
      borderRadius: '8px',
    },
  }

  return (
    <div
      style={styles[participant.role]}
      className="flex flex-col items-center justify-center p-4 w-full h-[76px] max-w-72 md:max-w-96 border border-[rgba(255,255,255,0.1)]"
    >
      {children}
    </div>
  )
}
