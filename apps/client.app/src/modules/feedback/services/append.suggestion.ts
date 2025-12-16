/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'server-only'

import { serverConfig as config } from '@/config'
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
