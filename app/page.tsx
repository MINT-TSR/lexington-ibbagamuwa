"use client"
import { useEffect, useMemo, useState } from 'react'
import { MONTHS, MonthKey, Student, Plan, Transaction, TransactionType, PaymentMethod } from '@/types/index'
import { formatLKR } from '@/utils/format'

type NewStudent = { name: string; className: string; monthlyFee: number }

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<NewStudent>({ name: '', className: '', monthlyFee: 0 })
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [txForm, setTxForm] = useState<{ type: TransactionType; amount: number; note: string }>({ type: 'income', amount: 0, note: '' })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filterMonth, setFilterMonth] = useState<MonthKey | ''>('')
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [showDeleteFor, setShowDeleteFor] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')
  let pressTimer: any

  async function load() {
    setLoading(true)
    const [sRes, pRes, tRes] = await Promise.all([
      fetch('/api/students', { cache: 'no-store' }),
      fetch('/api/plans', { cache: 'no-store' }),
      fetch('/api/transactions', { cache: 'no-store' }),
    ])
    const sData = await sRes.json(); const pData = await pRes.json(); const tData = await tRes.json()
    setStudents(sData.students || [])
    setPlans(pData.plans || [])
    setTransactions(tData.transactions || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addStudent() {
    if (!form.name || !form.className || (!selectedPlanId && !form.monthlyFee)) return
    setCreating(true)
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedPlanId ? { ...form, monthlyFee: 0 } : form),
    })
    const data = await res.json()
    if (data.student) setStudents(prev => [data.student, ...prev])
    if (data.student && selectedPlanId) {
      await fetch(`/api/students/${data.student.id}/plan`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: selectedPlanId }) })
      await load()
    }
    setForm({ name: '', className: '', monthlyFee: 0 })
    setSelectedPlanId('')
    setCreating(false)
  }

  async function setPayment(studentId: string, month: MonthKey, paid: boolean, method?: PaymentMethod) {
    const res = await fetch(`/api/students/${studentId}/payments`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ month, paid, method }) })
    const data = await res.json()
    if (data.student) setStudents(prev => prev.map(s => s.id === studentId ? data.student : s))
  }

  async function removeStudent(studentId: string) {
    await fetch(`/api/students/${studentId}`, { method: 'DELETE' })
    setStudents(prev => prev.filter(s => s.id !== studentId))
  }

  function startLongPress(studentId: string) {
    clearTimeout(pressTimer)
    pressTimer = setTimeout(() => setShowDeleteFor(studentId), 600)
  }
  function endLongPress() {
    clearTimeout(pressTimer)
  }

  const summary = useMemo(() => {
    const months = filterMonth ? [filterMonth] : MONTHS
    const totalRevenue = students.reduce((sum, s) => sum + months.filter(m => s.payments[m]?.paid).length * s.monthlyFee, 0)
    const pendingPayments = students.reduce((sum, s) => sum + months.filter(m => !s.payments[m]?.paid).length * s.monthlyFee, 0)
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const combined = totalRevenue + income - expense
    return { totalRevenue, pendingPayments, income, expense, combined }
  }, [students, transactions, filterMonth])

  async function addTx() {
    if (!txForm.amount) return
    const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(txForm) })
    const data = await res.json()
    if (data.transaction) setTransactions(prev => [data.transaction, ...prev])
    setTxForm({ type: 'income', amount: 0, note: '' })
  }

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-lg sm:text-2xl font-semibold tracking-tight">Lexington International — Preschool Payments</h1>
        <div className="text-xs sm:text-sm text-gray-600">Support: 0772459173</div>
      </header>

      <div className="grid md:grid-cols-12 gap-4 lg:gap-6">
        <aside className="md:col-span-5 space-y-4 order-1">
          <div className="rounded-xl border p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Summary</div>
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <a className="text-xs underline text-gray-700" href={`/api/export?${new URLSearchParams({ month: filterMonth || '', section: 'all' }).toString()}`} target="_blank">Export CSV (All)</a>
              <a className="text-xs underline text-gray-700" href={`/api/export?${new URLSearchParams({ month: filterMonth || '', section: 'income' }).toString()}`} target="_blank">Export CSV (Income)</a>
              <a className="text-xs underline text-gray-700" href={`/api/export?${new URLSearchParams({ month: filterMonth || '', section: 'expenses' }).toString()}`} target="_blank">Export CSV (Expenses)</a>
              <a className="text-xs underline text-gray-700" href={`/api/export?${new URLSearchParams({ month: filterMonth || '', section: 'student' }).toString()}`} target="_blank">Export CSV (Student Payments)</a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500">Total revenue</div>
                <div className="text-xl font-semibold">{formatLKR(summary.totalRevenue)}</div>
                <div className="mt-1 text-[10px] text-gray-500">(Revenue + Income) − Expense: {formatLKR(summary.combined)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500">Pending payments</div>
                <div className="text-xl font-semibold">{formatLKR(summary.pendingPayments)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500">Income</div>
                <div className="text-xl font-semibold">{formatLKR(summary.income)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500">Expense</div>
                <div className="text-xl font-semibold">{formatLKR(summary.expense)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Record income/expense</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select value={txForm.type} onChange={e => setTxForm(f => ({ ...f, type: e.target.value as TransactionType }))}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <input placeholder="Amount" type="number" value={txForm.amount || ''} onChange={e => setTxForm(f => ({ ...f, amount: Number(e.target.value) }))} />
              <input placeholder="Note (optional)" value={txForm.note} onChange={e => setTxForm(f => ({ ...f, note: e.target.value }))} />
              <button onClick={addTx} className="text-sm">Add</button>
            </div>
            <div className="mt-3 max-h-48 overflow-auto divide-y text-sm">
              {transactions.map(t => (
                <TransactionRow key={t.id} t={t} onDelete={async (id) => { await fetch(`/api/transactions/${id}`, { method: 'DELETE' }); setTransactions(prev => prev.filter(x => x.id !== id)) }} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Add student</div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input placeholder="Class" value={form.className} onChange={e => setForm(f => ({ ...f, className: e.target.value }))} />
              <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}>
                <option value="">Custom fee</option>
                {plans.map(p => (<option key={p.id} value={p.id}>{p.name} — {formatLKR(p.monthlyFee)}</option>))}
              </select>
              {!selectedPlanId && (
                <input placeholder="Custom fee (LKR)" type="number" value={form.monthlyFee || ''} onChange={e => setForm(f => ({ ...f, monthlyFee: Number(e.target.value) }))} />
              )}
              <button onClick={addStudent} disabled={creating} className="text-sm col-span-1">{creating ? 'Adding...' : 'Add'}</button>
            </div>
            <div className="mt-3 text-xs text-gray-500">Manage plans below.</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Plans</div>
            <PlanManager plans={plans} onCreated={p => setPlans(prev => [p, ...prev])} />
          </div>
        </aside>

        <section className="md:col-span-7 rounded-xl border p-4 order-2">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="text-sm font-medium text-gray-700">Students ({students.length})</div>
          <div className="flex items-center gap-2 flex-wrap">
            <input placeholder="Search by name" className="text-xs" onChange={e => setStudents(prev => [...prev])} onInput={e => setSearch((e.target as HTMLInputElement).value)} />
            <select className="text-xs" value={filterMonth} onChange={e => setFilterMonth(e.target.value as MonthKey | '')}>
              <option value="">All months</option>
              {MONTHS.map(m => (<option key={m} value={m}>{m.toUpperCase()}</option>))}
            </select>
            <select className="text-xs" value={filterPaid} onChange={e => setFilterPaid(e.target.value as any)}>
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <button onClick={load} className="bg-white text-gray-700 border text-xs px-3 py-1 hover:bg-gray-50">Refresh</button>
          </div>
        </div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="text-sm text-gray-500">No students yet. Add your first student above.</div>
        ) : (
          <div className="overflow-x-auto">
            {(() => { const visibleMonths = (filterMonth ? [filterMonth] : MONTHS) as MonthKey[]; return (
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-2">Name</th>
                  <th className="text-left py-2 pr-2">Class</th>
                  <th className="text-right py-2 pr-2">Fee</th>
                  {visibleMonths.map(m => (
                    <th key={m} className="py-2 px-1 text-center uppercase text-[10px] text-gray-500">{m}</th>
                  ))}
                  <th className="text-right py-2 pl-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))
                  .filter(s => {
                    if (!filterMonth) return true
                    const rec = s.payments[filterMonth]
                    if (filterPaid === 'all') return true
                    return filterPaid === 'paid' ? !!rec?.paid : !rec?.paid
                  })
                  .map(s => (
                  <tr
                    key={s.id}
                    className="border-b hover:bg-gray-50"
                    onMouseDown={() => startLongPress(s.id)}
                    onMouseUp={endLongPress}
                    onMouseLeave={endLongPress}
                    onTouchStart={() => startLongPress(s.id)}
                    onTouchEnd={endLongPress}
                  >
                    <td className="py-2 pr-2 font-medium">{s.name}</td>
                    <td className="py-2 pr-2">{s.className}</td>
                    <td className="py-2 pr-2 text-right">{formatLKR(s.monthlyFee)}</td>
                    {visibleMonths.map(m => (
                      <td key={m} className="py-1 px-1 text-center">
                        <div className="inline-flex items-center gap-1">
                          <select className="text-[10px]" value={s.payments[m]?.method || ''} onChange={e => setPayment(s.id, m as MonthKey, true, (e.target.value || undefined) as PaymentMethod)}>
                            <option value="">Method</option>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="bank">Bank</option>
                            <option value="online">Online</option>
                            <option value="other">Other</option>
                          </select>
                          <button onClick={() => setPayment(s.id, m as MonthKey, !s.payments[m]?.paid, s.payments[m]?.method)} className={`text-[10px] px-2 py-1 rounded ${s.payments[m]?.paid ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            {s.payments[m]?.paid ? 'Paid' : 'Mark Paid'}
                          </button>
                        </div>
                      </td>
                    ))}
                    <td className="py-2 pl-2 text-right">
                      {showDeleteFor === s.id && (
                        <button onClick={() => removeStudent(s.id)} className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded">Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )})()}
          </div>
        )}
        </section>
      </div>
    </main>
  )
}

function PlanManager({ plans, onCreated }: { plans: Plan[]; onCreated: (p: Plan) => void }) {
  const [name, setName] = useState('')
  const [fee, setFee] = useState<number>(0)
  async function create() {
    if (!name || !fee) return
    const res = await fetch('/api/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, monthlyFee: fee }) })
    const data = await res.json()
    if (data.plan) {
      onCreated(data.plan)
      setName(''); setFee(0)
    }
  }
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input placeholder="Plan name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Monthly fee" type="number" value={fee || ''} onChange={e => setFee(Number(e.target.value))} />
        <button onClick={create} className="text-sm">Create</button>
      </div>
      <div className="mt-3 grid gap-2 max-h-48 overflow-auto">
        {plans.map(p => (
          <div key={p.id} className="rounded border p-2 flex items-center justify-between text-sm">
            <div className="font-medium">{p.name}</div>
            <div>{formatLKR(p.monthlyFee)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TransactionRow({ t, onDelete }: { t: Transaction; onDelete: (id: string) => void }) {
  const [show, setShow] = useState(false)
  let pressTimer: any
  function start() { clearTimeout(pressTimer); pressTimer = setTimeout(() => setShow(true), 500) }
  function end() { clearTimeout(pressTimer) }
  return (
    <div className="py-2 flex items-center justify-between" onMouseDown={start} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchEnd={end}>
      <div className="text-gray-700">{t.type === 'income' ? 'Income' : 'Expense'} — {t.note || 'No note'}</div>
      <div className="flex items-center gap-2">
        {show && (
          <button onClick={() => onDelete(t.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded">Remove</button>
        )}
        <div className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>{formatLKR(t.amount)}</div>
      </div>
    </div>
  )
}

