import { PropsWithChildren } from 'react'
import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'
import { BaseProps } from './base.props'

export const Base = ({
  participant: { role },
  children,
}: PropsWithChildren<BaseProps>) => {
  const styles = {
    [AUDIO_MESSAGE_ROLE.OWNER]: { justifyContent: 'flex-end' },
    [AUDIO_MESSAGE_ROLE.OTHERS]: { justifyContent: 'flex-start' },
  }

  return (
    <div style={styles[role]} className="flex w-full">
      <div className="flex flex-col gap-3 w-full max-w-72 md:max-w-96">
        {children}
      </div>
    </div>
  )
}
