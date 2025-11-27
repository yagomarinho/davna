import config from '@/config'
import { apiKey } from '@/utils/api.key'
import { bearer } from '@/utils/bearer'
import { NextRequest, NextResponse } from 'next/server'

interface Options {
  data: any
  token: string
}

async function uploadAudio({ data, token }: Options) {
  const headers = new Headers()
  headers.set('X-Api-Key', apiKey(process.env.API_ACCESS_TOKEN!))
  headers.set('Authorization', bearer(token))

  const response = await fetch(`${process.env.API_BASE_URL}/audio/upload`, {
    method: 'POST',
    headers,
    body: data,
  })

  if (!response.ok || response.body === null) throw new Error(`Failed Upload`)

  return response.json()
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(config.session.token.cookieName)?.value

  if (!token)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()

  try {
    const audio = await uploadAudio({
      data: formData,
      token,
    })

    return NextResponse.json(audio)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    return NextResponse.json({ message: 'Failed to Upload' }, { status: 400 })
  }
}
