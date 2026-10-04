import type { Account, Goal, Loan, LoanStatus, Transaction } from '../types'
import { monthKey, todayStr } from './format'

/** Efecto de un movimiento sobre el total de las cuentas activas */
export function netChange(t: Transaction, activeIds: Set<string>): number {
  if (t.type === 'income') return activeIds.has(t.accountId) ? t.amount : 0
  if (t.type === 'expense') return activeIds.has(t.accountId) ? -t.amount : 0
  return (t.toAccountId && activeIds.has(t.toAccountId) ? t.amount : 0) - (activeIds.has(t.accountId) ? t.amount : 0)
}

/** Saldo actual = saldo inicial + ingresos - gastos ± transferencias */
export function accountBalance(a: Account, txs: Transaction[]): number {
  let b = a.initialBalance
  for (const t of txs) {
    if (t.type === 'income' && t.accountId === a.id) b += t.amount
    else if (t.type === 'expense' && t.accountId === a.id) b -= t.amount
    else if (t.type === 'transfer') {
      if (t.accountId === a.id) b -= t.amount
      if (t.toAccountId === a.id) b += t.amount
    }
  }
  return b
}

/** Las transferencias NO cuentan como ingreso ni gasto */
export function monthTotals(txs: Transaction[], month: string) {
  let income = 0
  let expense = 0
  for (const t of txs) {
    if (monthKey(t.date) !== month) continue
    if (t.type === 'income') income += t.amount
    else if (t.type === 'expense') expense += t.amount
  }
  return { income, expense }
}

export function expensesByCategory(txs: Transaction[], month: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const t of txs) {
    if (t.type !== 'expense' || monthKey(t.date) !== month) continue
    const k = t.categoryId ?? 'none'
    out[k] = (out[k] ?? 0) + t.amount
  }
  return out
}

export function monthSeries(txs: Transaction[], months: string[]) {
  return months.map((m) => ({ key: m, ...monthTotals(txs, m) }))
}

export function balanceSeries(accounts: Account[], txs: Transaction[], months: string[]) {
  const active = accounts.filter((a) => a.active)
  const ids = new Set(active.map((a) => a.id))
  const initial = active.reduce((s, a) => s + a.initialBalance, 0)
  return months.map((m) => {
    let b = initial
    for (const t of txs) if (monthKey(t.date) <= m) b += netChange(t, ids)
    return { key: m, balance: b }
  })
}

// ---------- Deudas / Personas que me deben ----------
export const loanPaid = (l: Loan) => l.payments.reduce((s, p) => s + p.amount, 0)
export const loanRemaining = (l: Loan) => Math.max(0, l.original - loanPaid(l))

export function loanStatus(l: Loan): LoanStatus {
  if (loanRemaining(l) === 0) return 'paid'
  if (l.dueDate && l.dueDate < todayStr()) return 'overdue'
  return loanPaid(l) > 0 ? 'partial' : 'pending'
}

// ---------- Metas ----------
export const goalSaved = (g: Goal) => g.contributions.reduce((s, c) => s + c.amount, 0)
export const percent = (part: number, total: number) => (total > 0 ? Math.min(100, (part / total) * 100) : 0)
