import 'server-only'

import { apiKey } from '@/utils/api.key'
import { bearer } from '@/utils/bearer'

import config from '@/config'

export async function revokeAuth(token: string): Promise<void> {
  const headers = new Headers()
  headers.set('X-Api-Key', apiKey(process.env.API_ACCESS_TOKEN!))
  headers.set('Authorization', bearer(token))

  try {
    const result = await fetch(`${config.api.baseUrl}/session`, {
      method: 'delete',
      cache: 'no-cache',
      headers,
    })

    if (!result.ok) throw new Error('Invalid Session')
  } catch {
    return
  }
}
