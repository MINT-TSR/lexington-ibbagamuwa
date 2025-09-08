import { NextResponse } from 'next/server'
import { deleteTransaction } from '@/utils/storage'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ok = deleteTransaction(params.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

