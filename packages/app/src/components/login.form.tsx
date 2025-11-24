'use client'

import { Button } from '@/components/button'
import {
  InlineNotification,
  NotificationHandle,
} from '@/components/inline.notification'
import { Input } from '@/components/input'
import { useRouter } from 'next/navigation'

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
    [],
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
      <form className="flex flex-col gap-4 items-center w-full max-w-96 border border-[#2C2C2C] bg-[#101010] rounded py-16 px-8">
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
