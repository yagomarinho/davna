/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'server-only'

import { serverConfig as config } from '@/config'
import { apiKey } from '@/shared/utils'

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
