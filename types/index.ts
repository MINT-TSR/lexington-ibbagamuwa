export type MonthKey = 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec'

export const MONTHS: MonthKey[] = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

export interface Student {
  id: string
  name: string
  className: string
  monthlyFee: number
  planId?: string | null
  payments: Record<MonthKey, PaymentRecord>
}

export interface DataFileShape {
  students: Student[]
  plans: Plan[]
  transactions: Transaction[]
  createdAt: string
  updatedAt: string
}

export interface Plan {
  id: string
  name: string
  monthlyFee: number
}

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  note?: string
  dateISO: string
}

export interface PaymentRecord {
  paid: boolean
  method?: PaymentMethod
}

export type PaymentMethod = 'cash' | 'card' | 'bank' | 'online' | 'other'

