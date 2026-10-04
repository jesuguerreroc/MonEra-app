// Todos los montos son ENTEROS en pesos (COP). 35000 = $35.000

/** 1300000 -> "1.300.000" (separador de miles manual para que sea igual en todos los navegadores) */
export function groupDigits(n: number): string {
  return String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatCOP(amount: number): string {
  return `${amount < 0 ? '-' : ''}$${groupDigits(amount)}`
}

/** Para ejes de gráficas: 1.300.000 -> "$1,3 M" */
export function formatCompact(n: number): string {
  const a = Math.abs(n)
  if (a >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace('.', ',')} M`
  if (a >= 1_000) return `$${Math.round(n / 1_000)} mil`
  return `$${n}`
}

/** Convierte lo que escribe el usuario ("35.000" o "35000") a entero. Máximo 12 dígitos. */
export function parseAmount(input: string): number {
  const digits = input.replace(/\D/g, '').slice(0, 12)
  return digits ? parseInt(digits, 10) : 0
}

// ---------- Fechas (texto AAAA-MM-DD, hora de Colombia) ----------

export function todayStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** "4 de octubre de 2026" */
export function formatDate(s: string): string {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(parseDateStr(s))
}

/** "4 oct" */
export function formatDateShort(s: string): string {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(parseDateStr(s)).replace('.', '')
}

export function shiftDay(s: string, delta: number): string {
  const d = parseDateStr(s)
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function friendlyDate(s: string): string {
  const today = todayStr()
  if (s === today) return 'Hoy'
  if (s === shiftDay(today, -1)) return 'Ayer'
  return formatDate(s)
}

export const monthKey = (s: string) => s.slice(0, 7)

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** "octubre de 2026" o, corto, "oct" */
export function monthLabel(key: string, short = false): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return short
    ? new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(d).replace('.', '')
    : new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(d)
}

export function lastMonths(n: number, endKey: string): string[] {
  return Array.from({ length: n }, (_, i) => shiftMonth(endKey, i - (n - 1)))
}

export function daysUntil(s: string): number {
  const a = parseDateStr(todayStr()).getTime()
  const b = parseDateStr(s).getTime()
  return Math.round((b - a) / 86_400_000)
}
