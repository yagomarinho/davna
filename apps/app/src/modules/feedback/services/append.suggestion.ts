import 'server-only'

import config from '@/config'
import { apiKey, bearer } from '@/shared/utils/'

export async function appendSuggestion(
  suggestion: string,
  token: string,
): Promise<void> {
  const headers = new Headers()

  headers.set('X-Api-Key', apiKey(process.env.API_ACCESS_TOKEN!))
  headers.set('Authorization', bearer(token))
  headers.set('Content-Type', 'application/json')

  const result = await fetch(`${config.api.baseUrl}/feedback/suggestion`, {
    method: 'POST',
    cache: 'no-cache',
    headers,
    body: JSON.stringify({ suggestion }),
  })

  if (!result.ok) throw new Error('Invalid suggestion Format')

  return
}
