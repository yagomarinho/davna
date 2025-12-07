'use client'

import { useCallback, useState } from 'react'

import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'
import { BaseProps } from './base.props'

export interface FooterProps extends BaseProps {
  onClick: (isActive: boolean) => any
}

export const Footer = ({ participant, onClick }: FooterProps) => {
  const [isActive, setIsActive] = useState(false)

  const styles = {
    [AUDIO_MESSAGE_ROLE.OWNER]: { justifyContent: 'flex-end' },
    [AUDIO_MESSAGE_ROLE.OTHERS]: { justifyContent: 'flex-start' },
  }

  const toogleIsActive = useCallback(() => {
    const updated = !isActive
    onClick(updated)
    setIsActive(updated)
  }, [isActive])

  return (
    <footer
      style={styles[participant.role]}
      className="flex flex-row items-center w-full"
    >
      <button className="flex h-max-3" onClick={toogleIsActive}>
        <span className="font-roboto text-[10px] leading-[1] text-[#FFFFFF]">
          {!isActive ? 'Transcrever' : 'Ver menos'}
        </span>
      </button>
    </footer>
  )
}
