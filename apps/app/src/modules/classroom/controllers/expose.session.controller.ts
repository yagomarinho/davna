import 'server-only'

import config from '@/config'
import { NextRequest, NextResponse } from 'next/server'

export function ExposeSessionController() {
  async function GET(request: NextRequest) {
    const token = request.cookies.get(config.session.token.cookieName)?.value
    return NextResponse.json({ token })
  }
  return {
    GET,
  }
}
