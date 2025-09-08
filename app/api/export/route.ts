import { NextRequest, NextResponse } from 'next/server'
import { MONTHS, MonthKey } from '@/types/index'
import { listTransactions, readData } from '@/utils/storage'

function toCSV(rows: string[][]): string {
  return rows.map(r => r.map(f => {
    if (f == null) return ''
    const s = String(f)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }).join(','))
  .join('\n')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const monthParam = (searchParams.get('month') || '').toLowerCase()
  const month = (MONTHS as string[]).includes(monthParam) ? monthParam as MonthKey : null
  const section = (searchParams.get('section') || 'all').toLowerCase() as 'all' | 'income' | 'expenses' | 'student'

  const data = readData()
  const tx = listTransactions()

  const rows: string[][] = []
  rows.push(['Section','Date','Name/Note','Type/Method','Month','Amount'])

  if (section === 'all' || section === 'income' || section === 'expenses') {
    const filteredTx = tx.filter(t => section === 'all' ? true : (section === 'income' ? t.type === 'income' : t.type === 'expense'))
    for (const t of filteredTx) {
      rows.push([
        t.type,
        new Date(t.dateISO).toISOString(),
        t.note || '',
        '',
        '',
        String(t.amount),
      ])
    }
  }

  if (section === 'all' || section === 'student') {
    for (const s of data.students) {
      const months = month ? [month] : MONTHS
      for (const m of months) {
        const rec = (s as any).payments[m]
        if (rec?.paid) {
          rows.push([
            'student',
            '',
            s.name,
            rec.method || '',
            m,
            String(s.monthlyFee),
          ])
        }
      }
    }
  }

  const csv = toCSV(rows)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="export-${month || 'all'}.csv"`,
    }
  })
}

