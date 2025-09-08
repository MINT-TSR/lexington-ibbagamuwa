import { NextRequest, NextResponse } from 'next/server'
import { setPayment } from '@/utils/storage'
import { MonthKey, PaymentMethod } from '@/types/index'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { month, paid, method } = body || {}
  const m = month as MonthKey
  if (!m || typeof paid !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const updated = setPayment(params.id, m, { paid, method: method as PaymentMethod })
  if (!updated) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  return NextResponse.json({ student: updated })
}

