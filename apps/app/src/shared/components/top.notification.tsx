'use client'

import { useEffect, useMemo } from 'react'
import { animated, useSpring } from '@react-spring/web'

export interface TopNotificationProps {
  type: 'info' | 'success' | 'error'
  message: string
  fixed?: boolean
}

export const TopNotification = ({
  type,
  message,
  fixed = false,
}: TopNotificationProps) => {
  const top = useMemo(() => (fixed ? 76 : 0), [fixed])
  const [springs, api] = useSpring(() => ({ from: { top } }), [top])

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

  useEffect(() => {
    api.start({
      from: { top: 0 },
      to: { top: 76 },
    })

    function close() {
      api.start({
        from: { top: 76 },
        to: { top: 0 },
      })
    }

    // eslint-disable-next-line no-undef
    let timer: NodeJS.Timeout

    if (!fixed)
      timer = setTimeout(() => {
        close()
      }, 3000)

    return () => {
      if (timer) clearTimeout(timer)
      if (fixed) close()
    }
  }, [fixed, api])

  return (
    <animated.div
      style={{
        ...styles[type],
        ...springs,
      }}
      className="fixed z-10 left-0 flex flex-row justify-center items-center w-full h-[32px] shadow-[0_4px_8px_rgba(0,0,0,0.65)]"
    >
      <span className="font-roboto font-medium text-xs">{message}</span>
    </animated.div>
  )
}
