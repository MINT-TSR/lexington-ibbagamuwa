import { NextResponse } from 'next/server'

function computeSignature(password: string | undefined, secret: string | undefined) {
  if (!password || !secret) return null
  const data = new TextEncoder().encode(`${password}:${secret}`)
  const hashBuffer = require('crypto').createHash('sha256').update(data).digest('hex')
  return hashBuffer
}

export function middleware(req: Request) {
  const url = new URL(req.url)
  const pathname = url.pathname

  // Allow public paths
  const publicPaths = [
    '/login',
    '/api/login',
    '/api/logout',
    '/_next',
    '/favicon',
    '/api/health',
  ]
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const expected = computeSignature(process.env.ADMIN_PASSWORD, process.env.AUTH_SECRET)
  if (!expected) {
    return NextResponse.next()
  }

  const cookie = (req as any).headers.get('cookie') || ''
  const token = cookie.split(';').map((s: string) => s.trim()).find((s: string) => s.startsWith('lex_auth='))?.split('=')[1]
  if (token === expected) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', req.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

