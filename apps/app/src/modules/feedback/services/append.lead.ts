import 'server-only'

import config from '@/config'
import { apiKey } from '@/shared/utils'

export async function appendLead(lead: string): Promise<void> {
  const headers = new Headers()

  headers.set('X-Api-Key', apiKey(process.env.API_ACCESS_TOKEN!))
  headers.set('Content-Type', 'application/json')

  const result = await fetch(`${config.api.baseUrl}/feedback/lead`, {
    method: 'POST',
    cache: 'no-cache',
    headers,
    body: JSON.stringify({ lead }),
  })

  if (!result.ok) throw new Error('Invalid Lead Format')

  return
}
