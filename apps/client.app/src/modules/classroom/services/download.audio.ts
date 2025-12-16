/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'server-only'

import { apiKey, bearer } from '@/shared/utils'

interface Config {
  audio_id: string
  token: string
}

export async function downloadAudio({ audio_id, token }: Config) {
  const headers = new Headers()
  headers.set('X-Api-Key', apiKey(process.env.API_ACCESS_TOKEN!))
  headers.set('Authorization', bearer(token))

  const response = await fetch(
    `${process.env.API_BASE_URL}/audio/${audio_id}`,
    {
      headers,
    },
  )

  if (!response.ok || response.body === null)
    throw new Error(`Invalid id: ${audio_id}`)

  return response.body
}
