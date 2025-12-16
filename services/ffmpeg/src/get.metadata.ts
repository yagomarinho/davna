/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Config } from './config'

export interface MetadataResponse {
  name: string
  mime: string
  duration: number
  format: string
  codec: string
}

export interface MetadataRequest {
  audio: Buffer
  name: string
  mime: string
}

interface Request {
  data: MetadataRequest
  config: Config
}

export async function getMetadata({
  data: { audio, name, mime },
  config,
}: Request): Promise<MetadataResponse | undefined> {
  const blob = new Blob([new Uint8Array(audio)])

  const file = new File([blob], name, { type: mime })
  const form = new FormData()
  form.append('file', file)

  const headers = new Headers()
  headers.append(config.apiKey.headerName, `apikey=${config.apiKey.key}`)

  const response = await fetch(`${config.baseUrl}/metadata`, {
    method: 'post',
    body: form,
    headers,
  })

  if (!response.ok) return

  const body = await response.json()

  return body
}
