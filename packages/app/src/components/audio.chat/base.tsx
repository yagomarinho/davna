import { PropsWithChildren } from 'react'
import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'
import { BaseProps } from './base.props'

export const Base = ({ role, children }: PropsWithChildren<BaseProps>) => {
  const styles = {
    [AUDIO_MESSAGE_ROLE.TEACHER]: { justifyContent: 'flex-start' },
    [AUDIO_MESSAGE_ROLE.STUDENT]: { justifyContent: 'flex-end' },
  }

  return (
    <div style={styles[role]} className="flex w-full">
      <div className="flex flex-col gap-3 w-full max-w-72 md:max-w-96">
        {children}
      </div>
    </div>
  )
}
