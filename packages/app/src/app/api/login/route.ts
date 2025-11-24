import config from '@/config'
import { login } from '@/services/login'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const session = await login({ email, password })

    const response = new NextResponse(undefined, { status: 201 })

    response.cookies.set(config.session.token.cookieName, session.token.value, {
      path: '/',
      expires: new Date(session.token.expiresIn),
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    })

    response.cookies.set(
      config.session.refresh_token.cookieName,
      session.refresh_token.value,
      {
        path: '/',
        expires: new Date(session.refresh_token.expiresIn),
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      },
    )

    return response
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    return new NextResponse(
      JSON.stringify({ status: 'failed', message: 'Internal server error' }),
      { status: 500 },
    )
  }
}
