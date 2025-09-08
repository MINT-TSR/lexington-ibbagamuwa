import { NextRequest, NextResponse } from 'next/server'
import { addTransaction, listTransactions } from '@/utils/storage'
import { TransactionType } from '@/types/index'

export async function GET() {
  return NextResponse.json({ transactions: listTransactions() })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, amount, note, dateISO } = body || {}
  if ((type !== 'income' && type !== 'expense') || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const tx = addTransaction({ type: type as TransactionType, amount, note, dateISO })
  return NextResponse.json({ transaction: tx })
}

