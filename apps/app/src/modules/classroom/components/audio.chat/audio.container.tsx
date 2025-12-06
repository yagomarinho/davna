import { PropsWithChildren } from 'react'
import { BaseProps } from './base.props'
import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'

export const AudioContainer = ({
  role,
  children,
}: PropsWithChildren<BaseProps>) => {
  const styles = {
    [AUDIO_MESSAGE_ROLE.TEACHER]: {
      backgroundColor: '#202020',
      borderRadius: '16px 8px 16px 8px',
    },
    [AUDIO_MESSAGE_ROLE.STUDENT]: {
      backgroundColor: '#2A3345',
      borderRadius: '8px 16px 8px 16px',
    },
  }

  return (
    <div
      style={styles[role]}
      className="flex flex-col gap-0.5 py-2 px-8 w-full max-w-72 md:max-w-96"
    >
      {children}
    </div>
  )
}
