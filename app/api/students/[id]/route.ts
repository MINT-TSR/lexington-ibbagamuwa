import { NextResponse } from 'next/server'
import { deleteStudent } from '@/utils/storage'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ok = deleteStudent(params.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

