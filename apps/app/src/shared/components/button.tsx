'use client'

import { PropsWithChildren } from 'react'

export interface ButtonProps {
  type: 'primary' | 'secondary' | 'ghost'
  style?: 'filled' | 'outlined'
  role?: 'button' | 'submit' | 'reset'
  stretch?: boolean
  onClick?: () => any
}

export const Button = ({
  type,
  style = 'filled',
  stretch = false,
  role = 'button',
  onClick,
  children,
}: PropsWithChildren<ButtonProps>) => {
  const styles = {
    primary: {
      color: '#FFF',
      backgroundColor: style === 'filled' ? '#385CAA' : '#0F1520',
      border: style === 'filled' ? 'none' : '1px solid rgba(56, 92, 170, 0.25)',
    },
    secondary: {
      color: '#000000',
      backgroundColor: '#D2D2D2',
      border: style === 'filled' ? 'none' : '1px solid rgba(56, 92, 170, 0.25)',
    },
    ghost: { color: '#FFF', background: 'transparent' },
  }

  return (
    <button
      className="flex justify-center items-center px-3 md:px-6 py-3 font-roboto font-medium text-xs md:text-base rounded-full"
      style={{ ...styles[type], width: stretch ? '100%' : undefined }}
      type={role}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
