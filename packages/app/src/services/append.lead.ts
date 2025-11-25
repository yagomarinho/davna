import 'server-only'

import { apiKey } from '@/utils/api.key'
import config from '@/config'

export async function appendLead(lead: string): Promise<void> {
  const headers = new Headers()

  headers.set('X-Api-Key', apiKey(process.env.API_ACCESS_TOKEN!))

  const result = await fetch(`${config.api.baseUrl}/lead`, {
    method: 'POST',
    cache: 'no-cache',
    headers,
    body: JSON.stringify({ lead }),
  })

  if (!result.ok) throw new Error('Invalid Lead Format')

  return
}
