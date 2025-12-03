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

  const response = await fetch(`${config.baseUrl}/convert`, {
    method: 'post',
    body: form,
    headers,
  })

  if (!response.ok) return

  const reader = response.body?.getReader()

  if (!reader) return

  const contentDisposition = response.headers.get('content-disposition') ?? ''

  const filenameMatch = contentDisposition.match(
    /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
  )

  const {
    name: updated_name,
    mime: updated_mime,
    codec,
    duration,
    format,
  } = {
    name: filenameMatch ? filenameMatch[1].replace(/['"]/g, '') : '',
    mime: response.headers.get('content-type') || '',
    codec: response.headers.get('x-file-codec') || '',
    duration: response.headers.get('x-file-duration')
      ? parseFloat(response.headers.get('x-file-duration') as string)
      : 0,
    format: response.headers.get('x-file-format') || '',
  }

  const buffer = await streamToBuffer(reader)

  return {
    buffer,
    name: updated_name,
    mime: updated_mime,
    codec,
    duration,
    format,
  }
}

async function streamToBuffer(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)))
}
