'use client'

import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Toast, ToastProps } from '../components'

export interface ToastContext {
  push: (toast: Omit<ToastProps, 'onClose'>) => any
}

export const ToastContext = createContext<ToastContext>({} as ToastContext)

interface NotificationToast extends Omit<ToastProps, 'onClose'> {
  id: string
}

export const ToastManager = ({ children }: PropsWithChildren<{}>) => {
  const idRef = useRef(0)
  const [toasts, setToasts] = useState<NotificationToast[]>([])

  function generateId() {
    const id = idRef.current.toString()
    idRef.current += 1
    return id
  }

  const removeToast = (id: string) => () => {
    setToasts(t => t.filter(tt => tt.id !== id))
  }

  const ctx = useMemo(
    () => ({
      push: ({ message, title, type }: Omit<ToastProps, 'onClose'>) => {
        setToasts(prev =>
          prev.concat({ id: generateId(), message, title, type }),
        )
      },
    }),
    [],
  )

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="absolute z-100 right-0 top-[92px] flex flex-col gap-4">
        {toasts.map(({ id, message, title, type }) => (
          <Toast
            key={id}
            message={message}
            title={title}
            type={type}
            onClose={removeToast(id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
