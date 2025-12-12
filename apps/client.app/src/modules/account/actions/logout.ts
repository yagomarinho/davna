'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { serverConfig as config } from '@/config'

import { revokeAuth } from '../services'

export async function logout() {
  const tokenName = config.session.token.cookieName
  const refreshName = config.session.refresh_token.cookieName

  const store = await cookies()
  const token = store.get(tokenName)?.value

  store.delete(tokenName)
  store.delete(refreshName)

  if (token) await revokeAuth(token)

  return redirect('/login')
}
