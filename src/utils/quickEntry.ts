import type { Account, Category, Transaction, TransactionType } from '../types'
import { parseDateStr, shiftDay } from './format'

/** Lo que se entendió de una frase como "25k almuerzo nequi". Todo es editable antes de guardar. */
export interface QuickDraft {
  type: TransactionType
  amount: number
  categoryId?: string
  accountId?: string
  toAccountId?: string
  date: string
  description: string
}

export interface QuickContext {
  accounts: Account[]
  categories: Category[]
  /** Historial, para aprender cómo sueles categorizar */
  transactions: Transaction[]
  today: string
}

/** minúsculas y sin tildes: "Sueldo Énero" → "sueldo enero" */
export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const STOP = new Set(['de', 'del', 'a', 'al', 'en', 'con', 'por', 'para', 'desde', 'hacia', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'mi', 'mis', 'me', 'lo', 'pesos', 'peso', 'cop'])
const TO_WORDS = new Set(['a', 'al', 'hacia', 'para'])
const FROM_WORDS = new Set(['de', 'del', 'desde'])

const INCOME_WORDS = new Set(['ingreso', 'ingresos', 'recibi', 'recibo', 'cobre', 'pagaron', 'gane', 'entrada'])
const EXPENSE_WORDS = new Set(['gasto', 'gastos', 'gaste', 'pague', 'compre', 'salida'])
const TRANSFER_WORDS = new Set(['transferencia', 'transferi', 'transfer', 'pase', 'movi', 'traslado', 'traslade'])

const THOUSAND = new Set(['k', 'mil', 'luca', 'lucas'])
const MILLION = new Set(['m', 'mm', 'millon', 'millones', 'palo', 'palos', 'mill'])

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

/** Palabras comunes → categoría predeterminada (ids fijos de las categorías que trae la app) */
const KEYWORDS: Record<string, string[]> = {
  'exp-food': ['almuerzo', 'almuerzos', 'desayuno', 'cena', 'comida', 'mercado', 'restaurante', 'rappi', 'domicilio', 'domicilios', 'd1', 'ara', 'exito', 'olimpica', 'carulla', 'jumbo', 'panaderia', 'pizza', 'hamburguesa', 'onces', 'frutas', 'corrientazo', 'empanada', 'empanadas', 'arepa', 'pollo', 'mecato', 'cafe', 'tinto', 'fruver', 'supermercado'],
  'exp-transport': ['uber', 'didi', 'taxi', 'bus', 'buseta', 'transmilenio', 'metro', 'sitp', 'gasolina', 'tanqueo', 'tanqueada', 'peaje', 'peajes', 'parqueadero', 'parqueo', 'cabify', 'indrive', 'pasaje', 'pasajes', 'mio', 'picap', 'transporte'],
  'exp-home': ['arriendo', 'arrendamiento', 'administracion', 'muebles', 'aseo', 'ferreteria', 'alquiler', 'hogar'],
  'exp-utilities': ['luz', 'agua', 'gas', 'internet', 'servicios', 'energia', 'epm', 'enel', 'codensa', 'acueducto', 'claro', 'movistar', 'tigo', 'wom', 'recarga', 'plan'],
  'exp-shopping': ['ropa', 'zapatos', 'tenis', 'camisa', 'pantalon', 'amazon', 'mercadolibre', 'falabella', 'shein', 'temu', 'compras'],
  'exp-fun': ['cine', 'fiesta', 'rumba', 'cerveza', 'cervezas', 'trago', 'tragos', 'concierto', 'bar', 'discoteca', 'paseo', 'salida', 'entretenimiento', 'boleta', 'boletas'],
  'exp-health': ['farmacia', 'drogueria', 'medico', 'medicina', 'medicinas', 'medicamento', 'eps', 'cita', 'odontologo', 'examen', 'examenes', 'salud', 'pastillas', 'gimnasio', 'gym'],
  'exp-edu': ['universidad', 'colegio', 'curso', 'libro', 'libros', 'matricula', 'semestre', 'platzi', 'udemy', 'educacion', 'clase', 'clases'],
  'exp-subs': ['netflix', 'spotify', 'disney', 'hbo', 'max', 'prime', 'youtube', 'icloud', 'chatgpt', 'suscripcion', 'crunchyroll', 'paramount', 'deezer'],
  'exp-tech': ['computador', 'portatil', 'audifonos', 'cargador', 'mouse', 'teclado', 'tecnologia', 'celular'],
  'exp-travel': ['viaje', 'hotel', 'vuelo', 'tiquete', 'tiquetes', 'airbnb', 'avion', 'hostal'],
  'inc-salary': ['salario', 'sueldo', 'nomina', 'quincena', 'prima'],
  'inc-freelance': ['freelance', 'honorarios', 'proyecto'],
  'inc-business': ['negocio', 'emprendimiento'],
  'inc-gift': ['regalo', 'regalaron'],
  'inc-sale': ['venta', 'vendi'],
}
const KEYWORD_TO_CAT = new Map<string, string>()
for (const [cat, words] of Object.entries(KEYWORDS)) for (const w of words) if (!KEYWORD_TO_CAT.has(w)) KEYWORD_TO_CAT.set(w, cat)
/** Palabras que por sí solas indican que es un ingreso */
const INCOME_CATEGORY_WORDS = new Set([...KEYWORDS['inc-salary'], 'freelance', 'honorarios', 'venta', 'vendi'])

/** "25k" · "25 mil" · "25.000" · "1,5M" · "2 palos" → pesos. Devuelve cuántas palabras usó. */
function readAmount(tokens: string[], i: number): { value: number; used: number; sign: '' | '+' | '-'; clear: boolean } | null {
  const m = /^([+-]?)\$?(\d[\d.,]*)([a-z]*)$/.exec(tokens[i])
  if (!m) return null
  const [, sign, num, glued] = m
  if (/^\d{1,2}[/-]\d{1,2}/.test(tokens[i])) return null // es una fecha
  let suffix = glued
  let used = 1
  if (!suffix && tokens[i + 1] && (THOUSAND.has(tokens[i + 1]) || MILLION.has(tokens[i + 1]))) { suffix = tokens[i + 1]; used = 2 }
  if (suffix && !THOUSAND.has(suffix) && !MILLION.has(suffix)) return null

  let value: number
  if (suffix) value = parseFloat(num.replace(/\.(?=.*[.,])/g, '').replace(',', '.')) // "1,5" o "1.5"
  else if (/^\d{1,3}([.,]\d{3})+$/.test(num)) value = Number(num.replace(/[.,]/g, '')) // "1.020.000"
  else value = parseFloat(num.replace(',', '.'))
  if (THOUSAND.has(suffix)) value *= 1_000
  if (MILLION.has(suffix)) value *= 1_000_000
  value = Math.round(value)
  // "clear": tiene k/mil/$/separador de miles, así que seguro es un monto (no un año o un número suelto)
  const clear = !!suffix || /[.,]\d{3}/.test(num) || tokens[i].includes('$') || !!sign
  return value > 0 ? { value, used, sign: sign as '' | '+' | '-', clear } : null
}

function readDate(tokens: string[], i: number, today: string): { date: string; used: number } | null {
  const t = tokens[i]
  if (t === 'hoy') return { date: today, used: 1 }
  if (t === 'ayer') return { date: shiftDay(today, -1), used: 1 }
  if (t === 'antier' || t === 'anteayer') return { date: shiftDay(today, -2), used: 1 }
  const wd = WEEKDAYS.indexOf(t)
  if (wd >= 0) {
    const diff = (parseDateStr(today).getDay() - wd + 7) % 7
    return { date: shiftDay(today, -diff), used: 1 }
  }
  const m = /^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/.exec(t)
  if (m) {
    const [d, mo] = [Number(m[1]), Number(m[2])]
    let y = m[3] ? Number(m[3]) : Number(today.slice(0, 4))
    if (y < 100) y += 2000
    const date = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const check = parseDateStr(date)
    if (check.getMonth() + 1 === mo && check.getDate() === d) return { date, used: 1 }
  }
  return null
}

/** Cuenta mencionada en la posición i (por su nombre completo, o por su primera palabra si es única). */
function readAccount(tokens: string[], i: number, accounts: Account[]): { id: string; used: number } | null {
  let best: { id: string; used: number } | null = null
  for (const a of accounts) {
    const words = norm(a.name).split(/\s+/).filter(Boolean)
    if (words.length && words.every((w, k) => tokens[i + k] === w) && (!best || words.length > best.used)) best = { id: a.id, used: words.length }
  }
  if (best) return best
  const t = tokens[i]
  if (t.length >= 3 && !STOP.has(t)) {
    const byFirst = accounts.filter((a) => norm(a.name).split(/\s+/)[0] === t)
    if (byFirst.length === 1) return { id: byFirst[0].id, used: 1 }
  }
  if (t === 'efectivo' || t === 'cash') {
    const cash = accounts.filter((a) => a.type === 'cash')
    if (cash.length === 1) return { id: cash[0].id, used: 1 }
  }
  return null
}

/** Palabras de tus movimientos anteriores → categoría que usaste (para aprender de ti) */
function learnedCategory(words: string[], type: TransactionType, txs: Transaction[]): string | undefined {
  if (!words.length) return undefined
  const want = new Set(words)
  const score = new Map<string, number>()
  for (const t of txs.slice(0, 1500)) {
    if (t.type !== type || !t.categoryId) continue
    for (const w of norm(t.description).split(/[^a-z0-9ñ]+/)) {
      if (want.has(w)) score.set(t.categoryId, (score.get(t.categoryId) ?? 0) + 1)
    }
  }
  let best: string | undefined
  let max = 0
  for (const [id, s] of score) if (s > max) { best = id; max = s }
  return best
}

/** Convierte una frase en un borrador de movimiento. Devuelve null si no encuentra un monto. */
export function parseQuickEntry(text: string, ctx: QuickContext): QuickDraft | null {
  const original = text.trim().split(/\s+/).filter(Boolean)
  const tokens = original.map(norm)
  const used = new Array<boolean>(tokens.length).fill(false)
  const take = (i: number, n = 1) => { for (let k = 0; k < n; k++) used[i + k] = true }
  const active = ctx.accounts.filter((a) => a.active)

  let amount = 0
  let sign: '' | '+' | '-' = ''
  let date = ctx.today
  let explicit: TransactionType | undefined
  const mentioned: { id: string; at: number; to: boolean; from: boolean }[] = []

  // Monto: el primero que claramente lo sea (25k, $25.000, 25 mil); si no hay, el primer número
  const found: { at: number; a: NonNullable<ReturnType<typeof readAmount>> }[] = []
  for (let i = 0; i < tokens.length; i++) { const a = readAmount(tokens, i); if (a) found.push({ at: i, a }) }
  const pick = found.find((f) => f.a.clear) ?? found[0]
  if (pick) { amount = pick.a.value; sign = pick.a.sign; take(pick.at, pick.a.used) }

  for (let i = 0; i < tokens.length; i++) {
    if (used[i]) continue
    const t = tokens[i]
    const d = readDate(tokens, i, ctx.today)
    if (d) { date = d.date; take(i, d.used); if (tokens[i - 1] === 'el' && !used[i - 1]) take(i - 1); continue }
    const acc = readAccount(tokens, i, active)
    if (acc) {
      const prev = tokens[i - 1]
      const to = TO_WORDS.has(prev)
      const from = FROM_WORDS.has(prev)
      mentioned.push({ id: acc.id, at: i, to, from })
      take(i, acc.used)
      if ((to || from || prev === 'en' || prev === 'con') && !used[i - 1]) take(i - 1)
      i += acc.used - 1
      continue
    }
    if (INCOME_WORDS.has(t)) { explicit ??= 'income'; take(i); if (tokens[i - 1] === 'me') take(i - 1); continue }
    if (EXPENSE_WORDS.has(t)) { explicit ??= 'expense'; take(i); continue }
    if (TRANSFER_WORDS.has(t)) { explicit ??= 'transfer'; take(i); continue }
  }
  if (!amount) return null

  const restWords = tokens.filter((t, i) => !used[i] && !STOP.has(t))
  const uniqueAccounts = [...new Map(mentioned.map((m) => [m.id, m])).values()]

  // Tipo: lo que dijiste explícitamente > signo > dos cuentas = transferencia > palabras de ingreso > gasto
  const type: TransactionType = explicit
    ?? (sign === '+' ? 'income' : sign === '-' ? 'expense' : undefined)
    ?? (uniqueAccounts.length >= 2 ? 'transfer' : undefined)
    ?? (restWords.some((w) => INCOME_CATEGORY_WORDS.has(w)) ? 'income' : 'expense')

  // Cuenta por defecto: la última que usaste
  const lastUsed = ctx.transactions.find((t) => active.some((a) => a.id === t.accountId))?.accountId ?? active[0]?.id

  let accountId: string | undefined
  let toAccountId: string | undefined
  if (type === 'transfer') {
    const from = uniqueAccounts.find((m) => m.from) ?? uniqueAccounts.find((m) => !m.to)
    let to = uniqueAccounts.find((m) => m.to && m !== from) ?? uniqueAccounts.find((m) => m !== from)
    if (from && to && from.id === to.id) to = undefined
    accountId = from?.id ?? (to?.id !== lastUsed ? lastUsed : active.find((a) => a.id !== to?.id)?.id)
    toAccountId = to?.id
  } else {
    accountId = uniqueAccounts[0]?.id ?? lastUsed
  }

  // Categoría: nombre de tus categorías > lo que aprendió de ti > palabras comunes
  let categoryId: string | undefined
  if (type !== 'transfer') {
    const cats = ctx.categories.filter((c) => c.type === type)
    const text = ` ${restWords.join(' ')} `
    categoryId = cats.find((c) => text.includes(` ${norm(c.name)} `))?.id
      ?? learnedCategory(restWords, type, ctx.transactions)
    if (!categoryId) {
      for (const w of restWords) {
        const id = KEYWORD_TO_CAT.get(w)
        if (id && cats.some((c) => c.id === id)) { categoryId = id; break }
      }
    }
  }

  // Descripción: lo que sobra de tu frase, tal como lo escribiste
  const rest = original.filter((_, i) => !used[i])
  while (rest.length && STOP.has(norm(rest[0]))) rest.shift()
  while (rest.length && STOP.has(norm(rest[rest.length - 1]))) rest.pop()
  let description = rest.join(' ')
  if (!description) description = type === 'transfer' ? 'Transferencia' : (ctx.categories.find((c) => c.id === categoryId)?.name ?? '')
  description = (description.charAt(0).toUpperCase() + description.slice(1)).slice(0, 120)

  return { type, amount, categoryId, accountId, toAccountId, date, description }
}

/** Qué le falta al borrador para poder guardarse */
export function draftMissing(d: QuickDraft): string | null {
  if (!d.accountId) return 'Elige una cuenta'
  if (d.type === 'transfer') {
    if (!d.toAccountId) return 'Elige la cuenta destino'
    if (d.toAccountId === d.accountId) return 'Origen y destino deben ser distintas'
  } else if (!d.categoryId) return 'Elige una categoría'
  return null
}
