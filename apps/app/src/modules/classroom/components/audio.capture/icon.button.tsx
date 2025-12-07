'use client'

import { PropsWithChildren } from 'react'

interface ButtonProps {
  onClick?: () => any
}

export const IconButton = ({
  onClick,
  children,
}: PropsWithChildren<ButtonProps>) => (
  <button
    onClick={onClick}
    className="flex justify-center items-center w-11 h-11"
  >
    {children}
  </button>
)
