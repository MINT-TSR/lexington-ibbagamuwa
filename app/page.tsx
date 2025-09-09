"use client"
import { useEffect, useState } from 'react'
import { MONTHS, MonthKey, Student, Plan, Transaction, TransactionType } from '@/types/index'
import { formatLKR } from '@/utils/format'

type NewStudent = { name: string; className: string; monthlyFee: number }

export default function Dashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [form, setForm] = useState<NewStudent>({ name: '', className: '', monthlyFee: 0 })
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [txForm, setTxForm] = useState<{ type: TransactionType; amount: number; note: string }>({ type: 'income', amount: 0, note: '' })
  const [filterMonth, setFilterMonth] = useState<MonthKey | ''>('')
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [search, setSearch] = useState<string>('')

  useEffect(() => {
    const auth = localStorage.getItem('authenticated')
    if (auth === 'true') {
      setAuthenticated(true)
      loadData()
    } else {
      window.location.href = '/login'
    }
  }, [])

  function loadData() {
    const savedStudents = localStorage.getItem('students')
    const savedPlans = localStorage.getItem('plans')
    const savedTransactions = localStorage.getItem('transactions')
    
    if (savedStudents) setStudents(JSON.parse(savedStudents))
    if (savedPlans) setPlans(JSON.parse(savedPlans))
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions))
  }

  function saveData() {
    localStorage.setItem('students', JSON.stringify(students))
    localStorage.setItem('plans', JSON.stringify(plans))
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }

  function addStudent() {
    if (!form.name || !form.className) return
    
    const newStudent: Student = {
      id: Date.now().toString(),
      name: form.name,
      className: form.className,
      monthlyFee: selectedPlanId ? plans.find(p => p.id === selectedPlanId)?.monthlyFee || 0 : form.monthlyFee,
      planId: selectedPlanId || undefined,
      payments: {}
    }
    
    setStudents([...students, newStudent])
    setForm({ name: '', className: '', monthlyFee: 0 })
    setSelectedPlanId('')
  }

  function addTransaction() {
    if (!txForm.amount || !txForm.note) return
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: txForm.type,
      amount: txForm.amount,
      note: txForm.note,
      date: new Date().toISOString()
    }
    
    setTransactions([...transactions, newTransaction])
    setTxForm({ type: 'income', amount: 0, note: '' })
  }

  function createPlan() {
    const name = prompt('Plan name:')
    const fee = prompt('Monthly fee:')
    if (!name || !fee) return
    
    const newPlan: Plan = {
      id: Date.now().toString(),
      name,
      monthlyFee: parseInt(fee)
    }
    
    setPlans([...plans, newPlan])
  }

  function togglePayment(studentId: string, month: MonthKey) {
    setStudents(students.map(student => {
      if (student.id === studentId) {
        const payments = { ...student.payments }
        if (payments[month]) {
          delete payments[month]
        } else {
          payments[month] = { paid: true, method: 'cash', date: new Date().toISOString() }
        }
        return { ...student, payments }
      }
      return student
    }))
  }

  function deleteStudent(id: string) {
    setStudents(students.filter(s => s.id !== id))
  }

  function deleteTransaction(id: string) {
    setTransactions(transactions.filter(t => t.id !== id))
  }

  useEffect(() => {
    saveData()
  }, [students, plans, transactions])

  if (!authenticated) {
    return <div>Loading...</div>
  }

  const filteredStudents = students.filter(student => 
    search === '' || student.name.toLowerCase().includes(search.toLowerCase())
  )

  const visibleMonths = filterMonth ? [filterMonth] : MONTHS

  const summary = {
    totalRevenue: students.reduce((sum, student) => {
      const fee = student.monthlyFee
      const paidMonths = Object.keys(student.payments).length
      return sum + (fee * paidMonths)
    }, 0),
    pendingPayments: students.reduce((sum, student) => {
      const fee = student.monthlyFee
      const paidMonths = Object.keys(student.payments).length
      const totalMonths = visibleMonths.length
      return sum + (fee * (totalMonths - paidMonths))
    }, 0),
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatLKR(summary.totalRevenue)}</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{formatLKR(summary.pendingPayments)}</div>
                  <div className="text-sm text-gray-600">Pending Payments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatLKR(summary.totalIncome)}</div>
                  <div className="text-sm text-gray-600">Total Income</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatLKR(summary.totalExpenses)}</div>
                  <div className="text-sm text-gray-600">Total Expenses</div>
                </div>
              </div>
            </div>

            {/* Add Student */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Add Student</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Student Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Class"
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Plan</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name} - {formatLKR(plan.monthlyFee)}</option>
                  ))}
                </select>
                {!selectedPlanId && (
                  <input
                    type="number"
                    placeholder="Monthly Fee"
                    value={form.monthlyFee}
                    onChange={(e) => setForm({ ...form, monthlyFee: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                )}
                <button
                  onClick={addStudent}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Add Student
                </button>
              </div>
            </div>

            {/* Plans */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Plans</h2>
                <button
                  onClick={createPlan}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Create Plan
                </button>
              </div>
              <div className="space-y-2">
                {plans.map(plan => (
                  <div key={plan.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{plan.name}</span>
                    <span className="font-semibold">{formatLKR(plan.monthlyFee)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Record Income/Expenses</h2>
              <div className="space-y-4">
                <select
                  value={txForm.type}
                  onChange={(e) => setTxForm({ ...txForm, type: e.target.value as TransactionType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Note"
                  value={txForm.note}
                  onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={addTransaction}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
                >
                  Add {txForm.type === 'income' ? 'Income' : 'Expense'}
                </button>
              </div>
              
              <div className="mt-4 space-y-2">
                {transactions.map(transaction => (
                  <div key={transaction.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatLKR(transaction.amount)}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">{transaction.note}</span>
                    </div>
                    <button
                      onClick={() => deleteTransaction(transaction.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Students */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Students ({students.length})</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                />
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value as MonthKey | '')}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">All Months</option>
                  {MONTHS.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <select
                  value={filterPaid}
                  onChange={(e) => setFilterPaid(e.target.value as 'all' | 'paid' | 'unpaid')}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Class</th>
                    <th className="text-left py-2">Fee</th>
                    {visibleMonths.map(month => (
                      <th key={month} className="text-center py-2">{month}</th>
                    ))}
                    <th className="text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="border-b">
                      <td className="py-2">{student.name}</td>
                      <td className="py-2">{student.className}</td>
                      <td className="py-2">{formatLKR(student.monthlyFee)}</td>
                      {visibleMonths.map(month => (
                        <td key={month} className="text-center py-2">
                          <button
                            onClick={() => togglePayment(student.id, month)}
                            className={`w-6 h-6 rounded text-xs ${
                              student.payments[month] 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {student.payments[month] ? '✓' : '○'}
                          </button>
                        </td>
                      ))}
                      <td className="text-center py-2">
                        <button
                          onClick={() => deleteStudent(student.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}