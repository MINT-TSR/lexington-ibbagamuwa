import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function createSignedCookie(value: string, secret: string) {
  const signature = crypto.createHmac('sha256', secret)
    .update(value)
    .digest('base64url')
  return `${value}.${signature}`
}

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
  const AUTH_SECRET = process.env.AUTH_SECRET
  
  if (!ADMIN_PASSWORD || !AUTH_SECRET) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
  }
  
  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 400 })
  }
  
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Create a signed cookie with timestamp
  const timestamp = Date.now().toString()
  const signedToken = createSignedCookie(timestamp, AUTH_SECRET)
  
  const res = NextResponse.json({ ok: true })
  res.cookies.set('lex_auth', signedToken, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax', 
    path: '/', 
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
  
  return res
}

