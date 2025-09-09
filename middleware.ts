import { NextResponse } from 'next/server'

export async function middleware(req: Request) {
  const url = new URL(req.url)
  const pathname = url.pathname

  // Allow public paths
  const publicPaths = [
    '/login',
    '/api/login',
    '/api/logout',
    '/_next',
    '/favicon.ico',
    '/api/health',
  ]
  
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check for authentication cookie from request headers
  const cookieHeader = req.headers.get('cookie') || ''
  const authCookieMatch = cookieHeader.match(/lex_auth=([^;]+)/)
  
  if (!authCookieMatch) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // Verify the cookie signature
  try {
    const { createHmac } = await import('crypto')
    const secret = process.env.AUTH_SECRET
    if (!secret) {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }

    const cookieValue = authCookieMatch[1]
    const [value, signature] = cookieValue.split('.')
    
    if (!value || !signature) {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(value)
      .digest('base64url')

    if (signature !== expectedSignature) {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  } catch (error) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

