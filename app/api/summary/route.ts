import { NextResponse } from 'next/server'
import { getSummary } from '@/utils/storage'

export async function GET() {
  const summary = getSummary()
  return NextResponse.json(summary)
}

