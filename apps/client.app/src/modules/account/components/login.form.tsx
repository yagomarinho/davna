'use client'

import { useRouter } from 'next/navigation'

import {
  Button,
  InlineNotification,
  Input,
  NotificationHandle,
} from '@/shared/components'

export interface LoginCredentials {
  email: string
  password: string
}

import { useCallback, useEffect, useRef, useState } from 'react'

export const LoginForm = () => {
  const router = useRouter()

  const notificationRef = useRef<NotificationHandle>(null)

  const [hasError, setHasError] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSign = useCallback(
    async ({ email, password }: LoginCredentials) => {
      try {
        if (!email || !password) throw new Error('Invalid Credentials')
        const headers = {
          'Content-Type': 'application/json',
        }

        const body = JSON.stringify({ email, password })

        const resp = await fetch('/api/login', {
          method: 'post',
          credentials: 'include',
          headers,
          body,
        })

        if (!resp.ok) throw new Error('Invalid Credentials')

        router.push('/dashboard')
      } catch {
        setHasError(true)
      }
    },
    [router],
  )

  useEffect(() => {
    const errorNotification = notificationRef.current

    if (errorNotification) {
      if (hasError) errorNotification.open()
      else errorNotification.close()
    }
  }, [hasError])

  return (
    <div className="flex justify-center items-center p-4 md:p-16 w-full">
      <form className="flex flex-col gap-4 md:gap-6 items-center w-full max-w-96 border border-[#2C2C2C]/35 rounded py-32 px-8">
        <Input placeholder="Email" value={email} onChange={setEmail} />
        <Input
          placeholder="Senha"
          type="password"
          value={password}
          onChange={setPassword}
        />
        <InlineNotification
          ref={notificationRef}
          type="error"
          message="Não foi possível entrar. Verifique as credenciais"
        />
        <Button
          type="primary"
          stretch
          onClick={() => handleSign({ email, password })}
        >
          Entrar
        </Button>
      </form>
    </div>
  )
}
