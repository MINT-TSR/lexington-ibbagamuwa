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
  console.log('Middleware - Cookie header:', cookieHeader)
  
  const authCookieMatch = cookieHeader.match(/lex_auth=([^;]+)/)
  console.log('Middleware - Auth cookie match:', authCookieMatch)
  
  if (!authCookieMatch) {
    console.log('Middleware - No auth cookie, redirecting to login')
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // Verify the cookie signature
  try {
    const { createHmac } = await import('crypto')
    const secret = process.env.AUTH_SECRET
    if (!secret) {
      console.log('Middleware - No AUTH_SECRET')
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }

    const cookieValue = authCookieMatch[1]
    const [value, signature] = cookieValue.split('.')
    console.log('Middleware - Cookie value:', value, 'Signature:', signature)
    
    if (!value || !signature) {
      console.log('Middleware - Invalid cookie format')
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(value)
      .digest('base64url')

    console.log('Middleware - Expected signature:', expectedSignature)

    if (signature !== expectedSignature) {
      console.log('Middleware - Signature mismatch')
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }

    console.log('Middleware - Authentication successful')
    return NextResponse.next()
  } catch (error) {
    console.log('Middleware - Error:', error)
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

