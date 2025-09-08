import { NextRequest, NextResponse } from 'next/server'
import { addStudent } from '@/utils/storage'
import { readData } from '@/utils/storage'

export async function GET() {
  const data = readData()
  return NextResponse.json({ students: data.students })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, className, monthlyFee } = body || {}
  if (!name || !className || typeof monthlyFee !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const student = addStudent({ name, className, monthlyFee })
  return NextResponse.json({ student })
}

