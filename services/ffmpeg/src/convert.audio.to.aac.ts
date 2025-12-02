import { Config } from './config'
import { MetadataResponse } from './get.metadata'

export interface ConvertResponse extends MetadataResponse {
  buffer: Buffer
}

export interface ConvertRequest {
  audio: Buffer
  name: string
  mime: string
}

interface Request {
  data: ConvertRequest
  config: Config
}

export async function convertAudioToAAC({
  data: { audio, name, mime },
  config,
}: Request): Promise<ConvertResponse | undefined> {
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

  return response.json()
}
