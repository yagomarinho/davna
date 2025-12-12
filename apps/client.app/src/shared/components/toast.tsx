'use client'

import { useCallback, useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import { animated, useSpring } from '@react-spring/web'

export interface ToastProps {
  type: 'info' | 'success' | 'error'
  title: string
  message: string
  onClose?: () => any
}

export const Toast = ({ title, message, type, onClose }: ToastProps) => {
  const [springs, api] = useSpring(() => ({ from: { right: -10 } }), [])

  const styles = {
    info: {
      backgroundColor: '#3965C6',
    },
    success: {
      backgroundColor: '#39C684',
    },
    error: {
      backgroundColor: '#972B38',
    },
  }

  const close = useCallback(() => {
    api.start({
      from: { right: 192 + 16 },
      to: { right: -10 },
    })

    onClose?.()
  }, [api, onClose])

  const open = useCallback(() => {
    api.start({
      from: { right: -10 },
      to: { right: 192 + 16 },
    })
  }, [api])

  useEffect(() => {
    open()

    const timer = setTimeout(() => {
      close()
    }, 8_000)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [open, close])

  return (
    <animated.div
      style={{
        transform: 'translateX(100%)',
        ...styles[type],
        ...springs,
      }}
      className="relative flex flex-col items-center justify-center gap-2 w-48 p-4 rounded-lg border border-white/25"
    >
      <header className="flex flex-row justify-between items-center w-full">
        <h3 className="font-roboto font-medium text-xs text-white text-nowrap w-full">
          {title}
        </h3>
        <button type="button" onClick={close}>
          <FiX size={16} color="white" />
        </button>
      </header>
      <span className="font-roboto text-xs text-[#D2D2D2] w-full">
        {message}
      </span>
    </animated.div>
  )
}
