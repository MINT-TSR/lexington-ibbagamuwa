import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function sign(password: string, secret: string) {
  const data = Buffer.from(`${password}:${secret}`)
  return crypto.createHash('sha256').update(data).digest('hex')
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
  const token = sign(password, AUTH_SECRET)
  const res = NextResponse.json({ ok: true })
  res.cookies.set('lex_auth', token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
  return res
}

