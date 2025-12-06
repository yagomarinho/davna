import { NextRequest, NextResponse } from 'next/server'
import config from './config'

import { ensureAuth, refreshAuth } from '@/modules/account'

const routes = [
  {
    path: '/login',
    match: 'exact',
    type: 'public',
  },
  {
    path: '/dashboard',
    match: 'starts-with',
    type: 'private',
  },
  {
    path: '/api/classroom',
    match: 'starts-with',
    type: 'private',
  },
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const route = routes.find(r => {
    if (r.match === 'exact') return r.path === path
    return path.startsWith(r.path)
  })

  // Recebo um path e então vejo se a rota está definida como strict
  // se não, então segue normal
  if (!route) return NextResponse.next({ request })

  const token = request.cookies.get(config.session.token.cookieName)?.value
  const refresh_token = request.cookies.get(
    config.session.refresh_token.cookieName,
  )?.value

  // Verifica se o usuário está logado e armazena as informações de sessão
  const session = token
    ? await ensureAuth(token)
    : refresh_token
      ? await refreshAuth(refresh_token)
      : undefined

  let response: NextResponse

  // Se for publica e estiver deslogado, então basta seguir adiante
  if (!session && route.type === 'public')
    response = NextResponse.next({ request })
  // Se for privada e estiver deslogado, redirecionar para o login com a estratégia de token redirect
  else if (!session && route.type === 'private')
    response = NextResponse.redirect(new URL('/login', request.nextUrl))
  // Se for publica e estiver logado, então redireciona para o dashboard
  else if (session && route.type === 'public')
    response = NextResponse.redirect(new URL('/dashboard', request.nextUrl))
  // Se for privada e o usuário estiver logado, então basta seguir adiante
  else response = NextResponse.next({ request })

  if (session) {
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
  }

  return response
}
