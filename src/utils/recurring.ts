import type { Recurring, Transaction } from '../types'
import { daysUntil, formatDateShort, parseDateStr, shiftDay } from './format'

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate()
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** Id fijo del movimiento de una fecha: así nunca se registra dos veces (ni desde dos celulares a la vez) */
export const recurringTxId = (r: Recurring, date: string) => `rec_${r.id}_${date}`

/** Fechas en que toca el pago entre from y to (inclusive), sin contar las anteriores a startDate */
export function occurrencesBetween(r: Recurring, from: string, to: string): string[] {
  const start = from < r.startDate ? r.startDate : from
  if (start > to) return []
  const out: string[] = []
  const [y0, m0] = start.split('-').map(Number)
  const [y1, m1] = to.split('-').map(Number)

  if (r.frequency === 'weekly') {
    let d = start
    const diff = (r.day - parseDateStr(d).getDay() + 7) % 7
    d = shiftDay(d, diff)
    for (; d <= to; d = shiftDay(d, 7)) out.push(d)
    return out
  }

  for (let y = y0, m = m0; y < y1 || (y === y1 && m <= m1); m === 12 ? (y++, m = 1) : m++) {
    const dim = daysIn(y, m)
    if (r.frequency === 'monthly') out.push(ymd(y, m, Math.min(r.day, dim)))
    else if (r.frequency === 'biweekly') out.push(ymd(y, m, 15), ymd(y, m, dim))
    else if (r.frequency === 'yearly' && r.month === m) out.push(ymd(y, m, Math.min(r.day, dim)))
  }
  return out.filter((d) => d >= start && d <= to)
}

export function nextOccurrence(r: Recurring, today: string): string | undefined {
  return occurrencesBetween(r, today, shiftDay(today, 400))[0]
}

export interface RecurringItem {
  r: Recurring
  date: string
  /** due: ya tocó (hoy o antes) · upcoming: en los próximos días */
  state: 'due' | 'upcoming'
}

/** Lo que falta por confirmar (últimas 6 semanas) y lo que viene en los próximos `aheadDays` días */
export function recurringAgenda(list: Recurring[], txIds: Set<string>, today: string, aheadDays = 7): RecurringItem[] {
  const out: RecurringItem[] = []
  for (const r of list) {
    if (!r.active) continue
    for (const date of occurrencesBetween(r, shiftDay(today, -42), shiftDay(today, aheadDays))) {
      if (txIds.has(recurringTxId(r, date)) || r.skipped.includes(date)) continue
      out.push({ r, date, state: date <= today ? 'due' : 'upcoming' })
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

/** ¿Ya se registró la fecha más reciente que tocaba? */
export function isUpToDate(r: Recurring, txIds: Set<string>, today: string): boolean {
  const past = occurrencesBetween(r, shiftDay(today, -42), today)
  const last = past[past.length - 1]
  return !last || txIds.has(recurringTxId(r, last)) || r.skipped.includes(last)
}

/** Último monto registrado (sirve de referencia en los de monto variable) */
export function lastAmount(r: Recurring, txs: Transaction[]): number | undefined {
  return txs.find((t) => t.recurringId === r.id)?.amount
}

/** Cuánto equivale al mes (para el total de gastos fijos) */
export function monthlyEquivalent(r: Recurring, txs: Transaction[]): number {
  const amount = r.variable ? (lastAmount(r, txs) ?? 0) : r.amount
  const factor = { monthly: 1, biweekly: 2, weekly: 52 / 12, yearly: 1 / 12 }[r.frequency]
  return Math.round(amount * factor)
}

export function frequencyLabel(r: Pick<Recurring, 'frequency' | 'day' | 'month'>): string {
  switch (r.frequency) {
    case 'monthly': return `Cada mes, el día ${r.day}`
    case 'biweekly': return 'Cada quincena (15 y fin de mes)'
    case 'weekly': return `Cada semana, el ${WEEKDAYS[r.day] ?? 'lunes'}`
    case 'yearly': return `Cada año, el ${r.day} de ${MONTHS[(r.month ?? 1) - 1]}`
  }
}

export const WEEKDAY_OPTIONS = WEEKDAYS.map((label, value) => ({ value, label: label[0].toUpperCase() + label.slice(1) }))
export const MONTH_OPTIONS = MONTHS.map((label, i) => ({ value: i + 1, label: label[0].toUpperCase() + label.slice(1) }))

/** Plantillas para crear rápido los más comunes */
export const RECURRING_TEMPLATES: { name: string; type: Recurring['type']; categoryId: string; variable: boolean; icon: string }[] = [
  { name: 'Arriendo', type: 'expense', categoryId: 'exp-home', variable: false, icon: 'home' },
  { name: 'Internet', type: 'expense', categoryId: 'exp-utilities', variable: false, icon: 'zap' },
  { name: 'Plan de celular', type: 'expense', categoryId: 'exp-utilities', variable: false, icon: 'zap' },
  { name: 'Luz', type: 'expense', categoryId: 'exp-utilities', variable: true, icon: 'zap' },
  { name: 'Agua', type: 'expense', categoryId: 'exp-utilities', variable: true, icon: 'zap' },
  { name: 'Gas', type: 'expense', categoryId: 'exp-utilities', variable: true, icon: 'zap' },
  { name: 'Netflix', type: 'expense', categoryId: 'exp-subs', variable: false, icon: 'repeat' },
  { name: 'Salario', type: 'income', categoryId: 'inc-salary', variable: false, icon: 'wallet' },
]

/** "Vence hoy", "Venció hace 2 días", "En 3 días · 15 oct" */
export function dueLabel(date: string): { text: string; urgent: boolean } {
  const n = daysUntil(date)
  if (n < 0) return { text: `Venció hace ${-n} ${n === -1 ? 'día' : 'días'}`, urgent: true }
  if (n === 0) return { text: 'Vence hoy', urgent: true }
  if (n === 1) return { text: 'Mañana', urgent: false }
  return { text: `En ${n} días · ${formatDateShort(date)}`, urgent: false }
}
