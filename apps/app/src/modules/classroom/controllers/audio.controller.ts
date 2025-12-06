import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import config from '@/config'
import { downloadAudio, uploadAudio } from '../services'

export function AudioController() {
  async function GET(request: NextRequest, ctx: any) {
    const { id } = await ctx.params
    const token = request.cookies.get(config.session.token.cookieName)?.value

    if (!token)
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    let audio: ReadableStream<Uint8Array<ArrayBuffer>>

    try {
      audio = await downloadAudio({ audio_id: id, token })
    } catch {
      return NextResponse.json(
        { message: `Invalid id: ${id}` },
        { status: 404 },
      )
    }

    return new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    })
  }

  async function POST(request: NextRequest) {
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

  return {
    GET,
    POST,
  }
}
