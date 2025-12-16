/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'server-only'

import { apiKey, bearer } from '@/shared/utils'

import { serverConfig as config } from '@/config'

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
