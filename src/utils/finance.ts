import type { Account, Goal, Loan, LoanStatus, Transaction } from '../types'
import { monthKey, todayStr } from './format'

/** Efecto de un movimiento sobre el total de las cuentas activas */
export function netChange(t: Transaction, activeIds: Set<string>): number {
  if (t.type === 'income') return activeIds.has(t.accountId) ? t.amount : 0
  if (t.type === 'expense') return activeIds.has(t.accountId) ? -t.amount : 0
  return (t.toAccountId && activeIds.has(t.toAccountId) ? t.amount : 0) - (activeIds.has(t.accountId) ? t.amount : 0)
}

/** Cuánto cambia el saldo de UNA cuenta con este movimiento (0 si no la toca) */
export function accountEffect(t: Transaction, accountId: string): number {
  if (t.type === 'income') return t.accountId === accountId ? t.amount : 0
  if (t.type === 'expense') return t.accountId === accountId ? -t.amount : 0
  return (t.toAccountId === accountId ? t.amount : 0) - (t.accountId === accountId ? t.amount : 0)
}

/** Saldo actual = saldo inicial + ingresos - gastos ± transferencias */
export function accountBalance(a: Account, txs: Transaction[]): number {
  return txs.reduce((b, t) => b + accountEffect(t, a.id), a.initialBalance)
}

export interface AccountEntry { tx: Transaction; delta: number; balanceAfter: number }

/** Movimientos de una cuenta (más recientes primero) con el saldo que quedó después de cada uno */
export function accountHistory(a: Account, txs: Transaction[]): AccountEntry[] {
  const mine = txs.filter((t) => t.accountId === a.id || t.toAccountId === a.id)
    .sort((x, y) => (x.date === y.date ? x.createdAt - y.createdAt : x.date.localeCompare(y.date)))
  let balance = a.initialBalance
  return mine.map((tx) => {
    const delta = accountEffect(tx, a.id)
    balance += delta
    return { tx, delta, balanceAfter: balance }
  }).reverse()
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
/** Fecha en que quedó saldada (último pago), o undefined si aún tiene saldo */
export function loanSettledOn(l: Loan): string | undefined {
  if (loanRemaining(l) > 0) return undefined
  return l.payments.reduce<string | undefined>((max, p) => (!max || p.date > max ? p.date : max), undefined)
}

export function loanStatus(l: Loan): LoanStatus {
  if (loanRemaining(l) === 0) return 'paid'
  if (l.dueDate && l.dueDate < todayStr()) return 'overdue'
  return loanPaid(l) > 0 ? 'partial' : 'pending'
}

// ---------- Metas ----------
export const goalSaved = (g: Goal) => g.contributions.reduce((s, c) => s + c.amount, 0)
export const percent = (part: number, total: number) => (total > 0 ? Math.min(100, (part / total) * 100) : 0)
