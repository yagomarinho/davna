'use client'

import { useCallback, useState } from 'react'
import { Button } from '../button'
import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'
import { BaseProps } from './base.props'

export interface FooterProps extends BaseProps {
  onClick: (isActive: boolean) => any
}

export const Footer = ({ role, onClick }: FooterProps) => {
  const [isActive, setIsActive] = useState(false)

  const styles = {
    [AUDIO_MESSAGE_ROLE.TEACHER]: { justifyContent: 'flex-start' },
    [AUDIO_MESSAGE_ROLE.STUDENT]: { justifyContent: 'flex-end' },
  }

  const toogleIsActive = useCallback(() => {
    const updated = !isActive
    onClick(updated)
    setIsActive(updated)
  }, [isActive])

  return (
    <footer style={styles[role]} className="flex flex-row items-center">
      <Button type="ghost" onClick={toogleIsActive}>
        <span className="font-roboto text-xs leading-[1.5] text-[#FFFFFF]">
          {!isActive ? 'Ver escrita' : 'Ver menos'}
        </span>
      </Button>
    </footer>
  )
}
