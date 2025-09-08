import fs from 'fs'
import path from 'path'
import { DataFileShape, MONTHS, MonthKey, Plan, Student, Transaction, TransactionType, PaymentRecord } from '@/types/index'

const DATA_FILE_NAME = 'data.json'

function getWritableDir() {
  // In Vercel serverless, persistent write is not supported between deploys.
  // Use /tmp for runtime writes; locally use project root /data.
  if (process.env.VERCEL) {
    return '/tmp'
  }
  return path.join(process.cwd(), 'data')
}

function ensureDirSync(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function initialData(): DataFileShape {
  const now = new Date().toISOString()
  return {
    students: [],
    plans: [],
    transactions: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function getDataFilePath() {
  const dir = getWritableDir()
  ensureDirSync(dir)
  return path.join(dir, DATA_FILE_NAME)
}

function normalizeData(obj: any): DataFileShape {
  const now = new Date().toISOString()
  const data: DataFileShape = {
    students: Array.isArray(obj?.students) ? obj.students : [],
    plans: Array.isArray(obj?.plans) ? obj.plans : [],
    transactions: Array.isArray(obj?.transactions) ? obj.transactions : [],
    createdAt: typeof obj?.createdAt === 'string' ? obj.createdAt : now,
    updatedAt: typeof obj?.updatedAt === 'string' ? obj.updatedAt : now,
  }
  // Ensure each student has payments for all months and optional planId
  for (const s of data.students) {
    if (!s.payments || typeof s.payments !== 'object') {
      s.payments = MONTHS.reduce((acc, m) => { acc[m] = { paid: false } as PaymentRecord; return acc }, {} as Record<MonthKey, PaymentRecord>)
    } else {
      for (const m of MONTHS) {
        const rec: any = (s as any).payments[m]
        if (typeof rec === 'boolean') {
          ;(s as any).payments[m] = { paid: rec } as PaymentRecord
        } else if (!rec || typeof rec.paid !== 'boolean') {
          ;(s as any).payments[m] = { paid: false } as PaymentRecord
        }
      }
    }
    if (typeof s.planId === 'undefined') s.planId = null
  }
  return data
}

export function readData(): DataFileShape {
  const filePath = getDataFilePath()
  if (!fs.existsSync(filePath)) {
    const data = initialData()
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return data
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(raw)
  const normalized = normalizeData(parsed)
  // If normalization added fields, persist back
  if (!parsed.plans || !parsed.transactions) {
    fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2), 'utf-8')
  }
  return normalized
}

export function writeData(mutator: (data: DataFileShape) => void): DataFileShape {
  const filePath = getDataFilePath()
  const data = readData()
  mutator(data)
  data.updatedAt = new Date().toISOString()
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return data
}

export function addStudent(input: { name: string; className: string; monthlyFee: number }): Student {
  const student: Student = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    className: input.className.trim(),
    monthlyFee: input.monthlyFee,
    planId: null,
    payments: MONTHS.reduce((acc, m) => { acc[m] = { paid: false } as PaymentRecord; return acc }, {} as Record<MonthKey, PaymentRecord>),
  }
  writeData(d => {
    d.students.push(student)
  })
  return student
}

export function setPayment(studentId: string, month: MonthKey, record: PaymentRecord): Student | null {
  let updated: Student | null = null
  writeData(d => {
    const s = d.students.find(s => s.id === studentId)
    if (!s) return
    s.payments[month] = { paid: !!record.paid, method: record.method }
    updated = s
  })
  return updated
}

export function getSummary() {
  const { students, transactions } = readData()
  const totalRevenue = students.reduce((sum, s) => {
    const paidMonths = MONTHS.filter(m => s.payments[m]?.paid).length
    return sum + paidMonths * s.monthlyFee
  }, 0)
  const pendingPayments = students.reduce((sum, s) => {
    const unpaidMonths = MONTHS.filter(m => !s.payments[m]?.paid).length
    return sum + unpaidMonths * s.monthlyFee
  }, 0)
  const missingMonthsByStudent = students.map(s => ({
    studentId: s.id,
    name: s.name,
    missing: MONTHS.filter(m => !s.payments[m]?.paid),
  }))
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = income - expense
  return { totalRevenue, pendingPayments, missingMonthsByStudent, income, expense, net }
}

// NOTE: format moved to utils/format to avoid client importing this file

// Plans
export function createPlan(input: { name: string; monthlyFee: number }): Plan {
  const plan: Plan = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, name: input.name.trim(), monthlyFee: input.monthlyFee }
  writeData(d => { d.plans.push(plan) })
  return plan
}

export function listPlans(): Plan[] {
  return readData().plans
}

export function assignStudentToPlan(studentId: string, planId: string): Student | null {
  let ret: Student | null = null
  writeData(d => {
    const s = d.students.find(s => s.id === studentId)
    const p = d.plans.find(p => p.id === planId)
    if (!s || !p) return
    s.planId = p.id
    s.monthlyFee = p.monthlyFee
    ret = s
  })
  return ret
}

// Transactions
export function addTransaction(input: { type: TransactionType; amount: number; note?: string; dateISO?: string }): Transaction {
  const tx: Transaction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    type: input.type,
    amount: input.amount,
    note: input.note?.trim(),
    dateISO: input.dateISO ?? new Date().toISOString(),
  }
  writeData(d => { d.transactions.push(tx) })
  return tx
}

export function listTransactions(): Transaction[] {
  return readData().transactions
}

export function deleteStudent(studentId: string): boolean {
  let removed = false
  writeData(d => {
    const before = d.students.length
    d.students = d.students.filter(s => s.id !== studentId)
    removed = d.students.length < before
  })
  return removed
}

export function deleteTransaction(transactionId: string): boolean {
  let removed = false
  writeData(d => {
    const before = d.transactions.length
    d.transactions = d.transactions.filter(t => t.id !== transactionId)
    removed = d.transactions.length < before
  })
  return removed
}

