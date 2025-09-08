import { NextRequest, NextResponse } from 'next/server'
import { createPlan, listPlans } from '@/utils/storage'

export async function GET() {
  return NextResponse.json({ plans: listPlans() })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, monthlyFee } = body || {}
  if (!name || typeof monthlyFee !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const plan = createPlan({ name, monthlyFee })
  return NextResponse.json({ plan })
}

