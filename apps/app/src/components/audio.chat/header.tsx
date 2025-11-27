import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'
import { BaseProps } from './base.props'

export const Header = ({ role }: BaseProps) => {
  const styles = {
    [AUDIO_MESSAGE_ROLE.TEACHER]: { justifyContent: 'flex-end' },
    [AUDIO_MESSAGE_ROLE.STUDENT]: { justifyContent: 'flex-start' },
  }

  return (
    <header style={styles[role]} className="flex flex-row items-center">
      <span className="font-roboto font-medium text-xs leading-[1.5] text-[#A2A2A2]">
        {role === AUDIO_MESSAGE_ROLE.TEACHER ? 'Teacher' : 'Student'}
      </span>
    </header>
  )
}
