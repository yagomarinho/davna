import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'
import { BaseProps } from './base.props'

export const Header = ({ participant }: BaseProps) => {
  const styles = {
    [AUDIO_MESSAGE_ROLE.OWNER]: { justifyContent: 'flex-start' },
    [AUDIO_MESSAGE_ROLE.OTHERS]: { justifyContent: 'flex-end' },
  }

  return (
    <header
      style={styles[participant.role]}
      className="flex flex-row items-center w-full"
    >
      <span className="font-roboto font-medium text-[10px] leading-[1] text-[#A2A2A2]">
        {participant.role === AUDIO_MESSAGE_ROLE.OTHERS
          ? participant.name
          : 'You'}
      </span>
    </header>
  )
}
