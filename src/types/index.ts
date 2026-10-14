export type AccountType = 'bank' | 'digital_wallet' | 'cash' | 'credit_card' | 'savings' | 'other'
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
  /** Si salió de un pago fijo: cuál y de qué fecha (AAAA-MM-DD) */
  recurringId?: string
  occurrence?: string
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

/** mensual (un día del mes) · quincenal (15 y último día) · semanal (un día de la semana) · anual (día y mes) */
export type Frequency = 'monthly' | 'biweekly' | 'weekly' | 'yearly'

/** Pago o ingreso fijo que se repite (arriendo, internet, salario…) */
export interface Recurring {
  id: string
  name: string
  type: TransactionType
  /** Monto fijo; si variable es true se pide al registrar (luz, agua, gas) */
  amount: number
  variable: boolean
  categoryId?: string
  accountId: string
  toAccountId?: string
  frequency: Frequency
  /** mensual/anual: día del mes (1-31) · semanal: día de la semana (0 = domingo) */
  day: number
  /** anual: mes (1-12) */
  month?: number
  /** Desde cuándo aplica (AAAA-MM-DD) */
  startDate: string
  /** Registrar solo sin preguntar (solo con monto fijo) */
  auto: boolean
  active: boolean
  /** Fechas que decidiste omitir (AAAA-MM-DD) */
  skipped: string[]
  createdAt: number
}
