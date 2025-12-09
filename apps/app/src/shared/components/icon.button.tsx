'use client'

import { PropsWithChildren } from 'react'

interface ButtonProps {
  type?: 'ghost' | 'filled'
  onClick?: () => any
}

export const IconButton = ({
  onClick,
  type = 'ghost',
  children,
}: PropsWithChildren<ButtonProps>) => {
  const styles = {
    ghost: {
      backgroundColor: 'transparent',
    },
    filled: {
      backgroundColor: '#2c2c2c',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 8,
    },
  }
  return (
    <button
      style={styles[type]}
      onClick={onClick}
      className="flex justify-center items-center w-11 h-11"
    >
      {children}
    </button>
  )
}
