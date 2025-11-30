import { Config } from './config'

export interface DurationResponse {
  name: string
  mime: string
  duration: number
}

export interface DurationRequest {
  audio: Buffer
  name: string
  mime: string
}

interface Request {
  data: DurationRequest
  config: Config
}

export async function getDuration({
  data: { audio, name, mime },
  config,
}: Request): Promise<DurationResponse | undefined> {
  const blob = new Blob([new Uint8Array(audio)])

  const file = new File([blob], name, { type: mime })
  const form = new FormData()
  form.append('file', file)

  const headers = new Headers()
  headers.append(config.apiKey.header, `apikey=${config.apiKey.key}`)

  const response = await fetch(`${config.baseUrl}/`, {
    method: 'post',
    body: form,
  })

  if (response.ok) return response.json()
}
