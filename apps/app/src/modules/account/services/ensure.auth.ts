import 'server-only'

import { apiKey, bearer } from '@/shared/utils'
import { serverConfig as config } from '@/config'

import { Session } from './login'

export async function ensureAuth(token: string): Promise<Session | undefined> {
  const headers = new Headers()

  headers.set('X-Api-Key', apiKey(process.env.API_ACCESS_TOKEN!))
  headers.set('Authorization', bearer(token))

  try {
    const result = await fetch(`${config.api.baseUrl}/session`, {
      cache: 'no-cache',
      headers,
    })

    if (!result.ok) throw new Error('Invalid Session')

    return result.json()
  } catch {
    return
  }
}
