import { NextRequest, NextResponse } from 'next/server'
import { assignStudentToPlan } from '@/utils/storage'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { planId } = body || {}
  if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 })
  const updated = assignStudentToPlan(params.id, planId)
  if (!updated) return NextResponse.json({ error: 'Student or plan not found' }, { status: 404 })
  return NextResponse.json({ student: updated })
}

