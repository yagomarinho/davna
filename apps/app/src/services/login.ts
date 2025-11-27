import 'server-only'

import config from '@/config'
import { apiKey } from '@/utils/api.key'

interface LoginCredentials {
  email: string
  password: string
}

export interface Token {
  value: string
  expiresIn: number
}

export interface Session {
  token: Token
  refresh_token: Token
}

export async function login({
  email,
  password,
}: LoginCredentials): Promise<Session> {
  const headers = new Headers()
  headers.set('X-Api-Key', apiKey(process.env.API_ACCESS_TOKEN!))
  headers.set('Content-Type', 'application/json')

  const result = await fetch(`${config.api.baseUrl}/session`, {
    method: 'post',
    cache: 'no-cache',
    headers,
    body: JSON.stringify({ email, password }),
  })

  if (!result.ok) throw new Error('Invalid Credentials')

  return result.json()
}
