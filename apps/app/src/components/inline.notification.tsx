'use client'

import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import { Button } from './button'
import { FiX } from 'react-icons/fi'

export interface InlineNotificationProps {
  type: 'success' | 'error' | 'warn' | 'info'
  message: string
  initial?: boolean
}

export interface NotificationHandle {
  open(): void
  close(): void
}

const styles = {
  success: { borderColor: '#2B975B', backgroundColor: '#14241B' },
  error: { borderColor: '#972B38', backgroundColor: '#241416' },
  warn: { borderColor: '#977C2B', backgroundColor: '#242014' },
  info: { borderColor: '#2B6C97', backgroundColor: '#141B24' },
}

export const InlineNotification = forwardRef<
  NotificationHandle,
  InlineNotificationProps
>(function InlineNotification({ type, message, initial = false }, ref) {
  const [isOpen, setIsOpen] = useState(initial)

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  useImperativeHandle(ref, () => ({ open, close }), [])

  return isOpen ? (
    <div
      className="flex flex-row gap-2 items-start border rounded p-4"
      style={styles[type]}
    >
      <p className="w-full">{message}</p>
      <Button type="ghost" onClick={close}>
        <FiX />
      </Button>
    </div>
  ) : null
})
