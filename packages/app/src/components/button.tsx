'use client'

import { PropsWithChildren } from 'react'

export interface ButtonProps {
  type: 'primary' | 'secondary' | 'ghost'
  role?: 'button' | 'submit' | 'reset'
  stretch?: boolean
  onClick?: () => any
}

export const Button = ({
  type,
  stretch = false,
  role = 'button',
  onClick,
  children,
}: PropsWithChildren<ButtonProps>) => {
  const styles = {
    primary: { color: '#FFF', backgroundColor: '#447FFD' },
    secondary: { color: '#000000', backgroundColor: '#D2D2D2' },
    ghost: { color: '#FFF', background: 'transparent' },
  }

  return (
    <button
      className={`flex justify-center items-center px-3 py-4 font-roboto font-medium text-sm rounded`}
      style={{ ...styles[type], width: stretch ? '100%' : undefined }}
      type={role}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
