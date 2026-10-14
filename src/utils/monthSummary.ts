import type { Budget, Category, Goal, Transaction } from '../types'
import { expensesByCategory, monthTotals } from './finance'
import { monthKey, parseDateStr, shiftDay, shiftMonth } from './format'

export interface MonthSummary {
  month: string
  prevMonth: string
  count: number
  income: number
  expense: number
  /** ingresos − gastos (las transferencias entre tus cuentas no cuentan) */
  net: number
  /** % de los ingresos que no se gastó (null si no hubo ingresos) */
  savingsRate: number | null
  prevExpense: number
  prevIncome: number
  topCategories: { category?: Category; amount: number; share: number }[]
  priciestDay?: { date: string; amount: number; items: Transaction[] }
  biggest?: Transaction
  daysWithEntries: number
  /** Días del mes (1-31) con al menos un registro */
  entryDays: number[]
  daysInMonth: number
  longestStreak: number
  budgets: { total: number; kept: number; worst?: { category?: Category; over: number } }
  goalContributions: number
}

/** Todo lo que muestra el resumen de un mes (AAAA-MM) */
export function buildMonthSummary(month: string, d: {
  transactions: Transaction[]; categories: Category[]; budgets: Budget[]; goals: Goal[]
}): MonthSummary {
  const txs = d.transactions.filter((t) => monthKey(t.date) === month)
  const prevMonth = shiftMonth(month, -1)
  const { income, expense } = monthTotals(txs, month)
  const prev = monthTotals(d.transactions, prevMonth)
  const cat = (id: string) => d.categories.find((c) => c.id === id)

  const byCat = expensesByCategory(txs, month)
  const topCategories = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([id, amount]) => ({ category: cat(id), amount, share: expense ? amount / expense : 0 }))

  const expenses = txs.filter((t) => t.type === 'expense')
  const byDay = new Map<string, Transaction[]>()
  for (const t of expenses) byDay.set(t.date, [...(byDay.get(t.date) ?? []), t])
  let priciestDay: MonthSummary['priciestDay']
  for (const [date, items] of byDay) {
    const amount = items.reduce((s, t) => s + t.amount, 0)
    if (!priciestDay || amount > priciestDay.amount) priciestDay = { date, amount, items: [...items].sort((a, b) => b.amount - a.amount) }
  }
  const biggest = [...expenses].sort((a, b) => b.amount - a.amount)[0]

  // Constancia: días con al menos un registro y la racha más larga de días seguidos
  const days = new Set(txs.map((t) => t.date))
  const [y, m] = month.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  let longestStreak = 0
  let run = 0
  for (let day = `${month}-01`; monthKey(day) === month; day = shiftDay(day, 1)) {
    run = days.has(day) ? run + 1 : 0
    longestStreak = Math.max(longestStreak, run)
  }

  // Presupuestos (son mensuales: se comparan con lo gastado ese mes)
  let kept = 0
  let worst: MonthSummary['budgets']['worst']
  for (const b of d.budgets) {
    const spent = byCat[b.categoryId] ?? 0
    if (spent <= b.amount) kept++
    else if (!worst || spent - b.amount > worst.over) worst = { category: cat(b.categoryId), over: spent - b.amount }
  }

  const goalContributions = d.goals.reduce((s, g) => s + g.contributions.filter((c) => monthKey(c.date) === month).reduce((a, c) => a + c.amount, 0), 0)

  return {
    month, prevMonth, count: txs.length, income, expense, net: income - expense,
    savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : null,
    prevExpense: prev.expense, prevIncome: prev.income,
    topCategories, priciestDay, biggest,
    daysWithEntries: days.size, entryDays: [...days].map((x) => Number(x.slice(8))).sort((a, b) => a - b), daysInMonth, longestStreak,
    budgets: { total: d.budgets.length, kept, worst },
    goalContributions,
  }
}

/** "lunes 15 de septiembre" */
export function longDate(s: string): string {
  return new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseDateStr(s))
}
