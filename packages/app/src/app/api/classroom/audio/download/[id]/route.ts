import config from '@/config'
import { apiKey } from '@/utils/api.key'
import { bearer } from '@/utils/bearer'
import { NextRequest, NextResponse } from 'next/server'

interface Config {
  audio_id: string
  token: string
}

export async function GET(request: NextRequest, ctx: any) {
  const { id } = await ctx.params
  const token = request.cookies.get(config.session.token.cookieName)?.value

  if (!token)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let audio: ReadableStream<Uint8Array<ArrayBuffer>>

  try {
    audio = await getAudioFromApi({ audio_id: id, token })
  } catch {
    return NextResponse.json({ message: `Invalid id: ${id}` }, { status: 404 })
  }

  return new NextResponse(audio, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  })

  async function getAudioFromApi({ audio_id, token }: Config) {
    const headers = new Headers()
    headers.set('X-Api-Key', apiKey(process.env.API_ACCESS_TOKEN!))
    headers.set('Authorization', bearer(token))

    const response = await fetch(
      `${process.env.API_BASE_URL}/audio/download/${audio_id}`,
      {
        headers,
      },
    )

    if (!response.ok || response.body === null)
      throw new Error(`Invalid id: ${audio_id}`)

    return response.body
  }
}
