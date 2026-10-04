export type AccountType = 'bank' | 'cash' | 'credit_card' | 'savings' | 'other'
export type TransactionType = 'expense' | 'income' | 'transfer'

export interface Account {
  id: string
  name: string
  type: AccountType
  /** Entero en COP. En tarjetas de crédito es negativo (lo que debes). */
  initialBalance: number
  currency: 'COP'
  color: string
  icon: string
  active: boolean
}

export interface Category {
  id: string
  name: string
  type: 'expense' | 'income'
  icon: string
  color: string
  isDefault?: boolean
}

export interface Transaction {
  id: string
  type: TransactionType
  /** Siempre positivo; el tipo define si suma, resta o mueve. */
  amount: number
  categoryId?: string
  description: string
  accountId: string
  toAccountId?: string
  /** Fecha como texto AAAA-MM-DD (hora de Colombia) */
  date: string
  notes?: string
  createdAt: number
}

export interface Payment {
  id: string
  amount: number
  date: string
  note?: string
}

/** Sirve para Deudas (yo debo) y Personas que me deben */
export interface Loan {
  id: string
  name: string
  original: number
  dueDate?: string
  notes?: string
  payments: Payment[]
  createdAt: number
}

export type LoanStatus = 'pending' | 'partial' | 'paid' | 'overdue'

export interface Budget {
  id: string
  categoryId: string
  /** Límite mensual (se repite cada mes) */
  amount: number
}

export interface Goal {
  id: string
  name: string
  target: number
  targetDate?: string
  contributions: Payment[]
  createdAt: number
}
