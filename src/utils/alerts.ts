import type { Account, Budget, Category, Loan, Transaction } from '../types'
import { expensesByCategory, loanRemaining } from './finance'
import { daysUntil, formatCOP, formatDate, monthKey, shiftMonth } from './format'

export type AlertKind = 'budget' | 'pace' | 'unusual' | 'big' | 'due' | 'receivable' | 'negative' | 'habit'
export type AlertLevel = 'danger' | 'warning' | 'info'

export interface AppAlert {
  /** Estable: si la marcas como "Entendido", no vuelve a salir (las mensuales vuelven el mes siguiente) */
  id: string
  kind: AlertKind
  level: AlertLevel
  title: string
  text: string
  /** Página a la que lleva al tocarla */
  to: string
}

export interface AlertPrefs {
  enabled: Record<AlertKind, boolean>
  /** % del presupuesto a partir del cual avisar */
  budgetThreshold: number
}

export const DEFAULT_ALERT_PREFS: AlertPrefs = {
  enabled: { budget: true, pace: true, unusual: true, big: true, due: true, receivable: true, negative: true, habit: true },
  budgetThreshold: 80,
}

export const ALERT_KIND_LABEL: Record<AlertKind, { label: string; hint: string }> = {
  budget: { label: 'Presupuestos', hint: 'Cuando te acercas o pasas del límite' },
  pace: { label: 'Ritmo de gasto', hint: 'Si a este paso superarás un presupuesto' },
  unusual: { label: 'Gastos fuera de lo normal', hint: 'Una categoría muy por encima de tu promedio' },
  big: { label: 'Gastos altos', hint: 'Un gasto mucho mayor de lo habitual' },
  due: { label: 'Deudas por vencer', hint: 'Vencen en 3 días o menos, o ya vencieron' },
  receivable: { label: 'Cobros atrasados', hint: 'Alguien no te pagó en la fecha acordada' },
  negative: { label: 'Cuentas en negativo', hint: 'Una cuenta quedó por debajo de $0' },
  habit: { label: 'Recordatorio de registro', hint: 'Si llevas 4 días sin registrar nada' },
}

interface Input {
  accounts: Account[]
  balances: Record<string, number>
  categories: Category[]
  transactions: Transaction[] // de más reciente a más antiguo
  budgets: Budget[]
  debts: Loan[]
  receivables: Loan[]
  today: string
  prefs: AlertPrefs
}

const ORDER: Record<AlertLevel, number> = { danger: 0, warning: 1, info: 2 }
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Revisa tus datos y devuelve las alertas que aplican hoy (de más a menos importante). */
export function computeAlerts(d: Input): AppAlert[] {
  const on = d.prefs.enabled
  const out: AppAlert[] = []
  const catName = (id: string) => d.categories.find((c) => c.id === id)?.name ?? 'Sin categoría'
  const month = monthKey(d.today)
  const [y, m, day] = d.today.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const daysLeft = daysInMonth - day
  const spent = expensesByCategory(d.transactions, month)

  // ---- Presupuestos ----
  for (const b of d.budgets) {
    if (b.amount <= 0) continue
    const s = spent[b.categoryId] ?? 0
    const pct = (s / b.amount) * 100
    const name = catName(b.categoryId)
    if (on.budget && pct >= 100) {
      out.push({ id: `budget-over:${b.id}:${month}`, kind: 'budget', level: 'danger', to: '/presupuestos',
        title: `Te pasaste del presupuesto de ${name}`,
        text: `Llevas ${formatCOP(s)} de ${formatCOP(b.amount)}: ${formatCOP(s - b.amount)} de más.` })
    } else if (on.budget && pct >= d.prefs.budgetThreshold) {
      out.push({ id: `budget-near:${b.id}:${month}`, kind: 'budget', level: 'warning', to: '/presupuestos',
        title: `Llevas el ${Math.round(pct)}% del presupuesto de ${name}`,
        text: `Te quedan ${formatCOP(b.amount - s)} y ${daysLeft === 0 ? 'hoy termina el mes' : `faltan ${plural(daysLeft, 'día', 'días')}`}.` })
    } else if (on.pace && s > 0 && day >= 5) {
      const perDay = s / day
      const dayOver = Math.ceil(b.amount / perDay)
      if (dayOver <= daysInMonth && perDay * daysInMonth > b.amount * 1.05) {
        out.push({ id: `budget-pace:${b.id}:${month}`, kind: 'pace', level: 'info', to: '/presupuestos',
          title: `A este ritmo superarás el presupuesto de ${name}`,
          text: `Sería cerca del día ${dayOver}. Gastas en promedio ${formatCOP(Math.round(perDay))} al día en esta categoría.` })
      }
    }
  }

  // ---- Categoría muy por encima de tu promedio (últimos 3 meses con gastos) ----
  if (on.unusual) {
    const prev = [1, 2, 3].map((k) => expensesByCategory(d.transactions, shiftMonth(month, -k)))
    for (const [catId, now] of Object.entries(spent)) {
      const past = prev.map((p) => p[catId] ?? 0).filter((v) => v > 0)
      if (past.length < 2) continue
      const avg = past.reduce((a, v) => a + v, 0) / past.length
      if (now > avg * 1.4 && now - avg >= 50_000) {
        out.push({ id: `unusual:${catId}:${month}`, kind: 'unusual', level: 'info', to: '/reportes',
          title: `Gastos altos en ${catName(catId)}`,
          text: `Este mes llevas ${formatCOP(now)}, un ${Math.round((now / avg - 1) * 100)}% más que tu promedio (${formatCOP(Math.round(avg))}).` })
      }
    }
  }

  // ---- Un gasto mucho mayor de lo normal (últimos 7 días) ----
  if (on.big) {
    for (const t of d.transactions) {
      if (daysUntil(t.date) < -7) break
      if (t.type !== 'expense' || !t.categoryId || t.amount < 100_000 || daysUntil(t.date) > 0) continue
      const others = d.transactions.filter((o) => o.type === 'expense' && o.categoryId === t.categoryId && o.id !== t.id).map((o) => o.amount)
      if (others.length < 5) continue
      const usual = median(others)
      if (t.amount >= usual * 3) {
        out.push({ id: `big:${t.id}`, kind: 'big', level: 'info', to: '/movimientos',
          title: `Gasto alto en ${catName(t.categoryId)}`,
          text: `"${t.description}" por ${formatCOP(t.amount)}: más del triple de lo que sueles gastar ahí (${formatCOP(Math.round(usual))}).` })
      }
    }
  }

  // ---- Deudas por vencer o vencidas ----
  if (on.due) {
    for (const l of d.debts) {
      const rem = loanRemaining(l)
      if (rem <= 0 || !l.dueDate) continue
      const n = daysUntil(l.dueDate)
      if (n < 0) {
        out.push({ id: `due-over:${l.id}:${l.dueDate}`, kind: 'due', level: 'danger', to: '/deudas',
          title: `La deuda con ${l.name} está vencida`, text: `Venció el ${formatDate(l.dueDate)}. Saldo pendiente: ${formatCOP(rem)}.` })
      } else if (n <= 3) {
        out.push({ id: `due-soon:${l.id}:${l.dueDate}`, kind: 'due', level: 'warning', to: '/deudas',
          title: n === 0 ? `La deuda con ${l.name} vence hoy` : `La deuda con ${l.name} vence en ${plural(n, 'día', 'días')}`,
          text: `Saldo pendiente: ${formatCOP(rem)}.` })
      }
    }
  }

  // ---- Personas que no te pagaron a tiempo ----
  if (on.receivable) {
    for (const l of d.receivables) {
      const rem = loanRemaining(l)
      if (rem <= 0 || !l.dueDate || daysUntil(l.dueDate) >= 0) continue
      out.push({ id: `recv-over:${l.id}:${l.dueDate}`, kind: 'receivable', level: 'warning', to: '/me-deben',
        title: `${l.name} debía pagarte el ${formatDate(l.dueDate)}`, text: `Aún te debe ${formatCOP(rem)}.` })
    }
  }

  // ---- Cuentas en negativo (las tarjetas de crédito son negativas por naturaleza) ----
  if (on.negative) {
    for (const a of d.accounts) {
      const bal = d.balances[a.id] ?? 0
      if (!a.active || a.type === 'credit_card' || bal >= 0) continue
      out.push({ id: `neg:${a.id}:${month}`, kind: 'negative', level: 'danger', to: `/cuentas/${a.id}`,
        title: `${a.name} está en negativo`, text: `Saldo: ${formatCOP(bal)}. Revisa si falta registrar un ingreso o una transferencia.` })
    }
  }

  // ---- Hace días que no registras nada ----
  if (on.habit && d.transactions.length) {
    const last = d.transactions.reduce((max, t) => (t.date > max && t.date <= d.today ? t.date : max), '')
    const gap = last ? -daysUntil(last) : 0
    if (gap >= 4) {
      out.push({ id: `habit:${last}`, kind: 'habit', level: 'info', to: '/movimientos',
        title: `No registras movimientos hace ${gap} días`,
        text: '¿Se te pasó algún gasto? Puedes registrarlo rápido escribiendo, por ejemplo, "25k almuerzo".' })
    }
  }

  return out.sort((a, b) => ORDER[a.level] - ORDER[b.level])
}
