import { saveItem } from './db'
import { recurringTxId } from '../utils/recurring'
import { shiftDay } from '../utils/format'
import type { Recurring } from '../types'

/** Registra el pago fijo de esa fecha como un movimiento normal (con id fijo: nunca se duplica). */
export async function registerOccurrence(uid: string, r: Recurring, date: string, amount: number, accountId = r.accountId) {
  await saveItem(uid, 'transactions', {
    id: recurringTxId(r, date),
    type: r.type, amount, accountId, date,
    description: r.name.slice(0, 120),
    ...(r.type === 'transfer' ? { toAccountId: r.toAccountId } : { categoryId: r.categoryId }),
    recurringId: r.id, occurrence: date,
    createdAt: Date.now(),
  })
}

/** Marca esa fecha como omitida (p. ej. ese mes no pagaste Netflix). Guarda solo los últimos 4 meses. */
export async function skipOccurrence(uid: string, r: Recurring, date: string) {
  const keep = r.skipped.filter((d) => d >= shiftDay(date, -120) && d !== date)
  await saveItem(uid, 'recurring', { ...r, skipped: [...keep, date] })
}
