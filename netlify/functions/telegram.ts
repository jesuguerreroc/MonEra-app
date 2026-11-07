/**
 * Bot de Telegram de Monera.
 *
 * Telegram llama a esta función (webhook) cada vez que le escribes al bot. La función lee y escribe
 * en el mismo Firestore que usa la app, así que lo que registres aquí aparece al instante en la app.
 *
 * URL: https://<tu-sitio>/.netlify/functions/telegram
 * Variables de entorno (Netlify): TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET,
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY y, opcional, APP_URL.
 *
 * Firestore (solo lo escribe este servidor):
 *   telegramCodes/{código}  → { uid, expiresAt }   código de un solo uso que crea la app para vincular
 *   telegramChats/{chatId}  → { uid, username, pending, lastTxIds }   chat vinculado a una cuenta
 *   users/{uid}.telegram    → { chatId, username, linkedAt }   para que la app muestre "Conectado"
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { AggregateField, FieldValue, getFirestore, type Query } from 'firebase-admin/firestore'
import type { Account, Category, Transaction, TransactionType } from '../../src/types'
import { draftMissing, parseQuickEntry, type QuickDraft } from '../../src/utils/quickEntry'
import { expensesByCategory, monthTotals } from '../../src/utils/finance'
import { formatCOP, friendlyDate, monthKey, monthLabel, shiftMonth, todayStr } from '../../src/utils/format'

// ---------- Configuración ----------

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? ''
const APP_URL = process.env.APP_URL || process.env.URL || ''

function db() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Netlify guarda los saltos de línea de la clave como "\n" literal
        privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
      }),
    })
  }
  return getFirestore()
}

const TYPE_LABEL: Record<TransactionType, string> = { expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia' }
const TYPE_EMOJI: Record<TransactionType, string> = { expense: '💸', income: '💰', transfer: '🔁' }
const NEXT_TYPE: Record<TransactionType, TransactionType> = { expense: 'income', income: 'transfer', transfer: 'expense' }

// ---------- Tipos mínimos de Telegram ----------

interface TgChat { id: number; type: string }
interface TgUser { id: number; username?: string; first_name?: string }
interface TgMessage { message_id: number; chat: TgChat; from?: TgUser; text?: string }
interface TgCallback { id: string; from: TgUser; message?: TgMessage; data?: string }
interface TgUpdate { message?: TgMessage; callback_query?: TgCallback }
type Button = { text: string; callback_data?: string; url?: string }
type Keyboard = Button[][]

/** Lo que guardamos de cada chat vinculado */
interface ChatDoc {
  uid: string
  username?: string
  firstName?: string
  linkedAt: number
  /** Borrador esperando confirmación y el mensaje donde se muestra */
  pending?: QuickDraft & { messageId: number }
  /** Movimientos creados desde el bot (para /deshacer), el último al final */
  lastTxIds?: string[]
}

// ---------- API de Telegram ----------

async function tg<T = unknown>(method: string, body: object): Promise<T | null> {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => null)) as { ok: boolean; result: T; description?: string } | null
  if (!json?.ok) {
    // "message is not modified" ocurre si tocas dos veces el mismo botón: no es un error real
    if (!json?.description?.includes('not modified')) console.error(`Telegram ${method}:`, json?.description ?? res.status)
    return null
  }
  return json.result
}

const send = (chatId: number, text: string, keyboard?: Keyboard) =>
  tg<TgMessage>('sendMessage', {
    chat_id: chatId, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true },
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  })

const edit = (chatId: number, messageId: number, text: string, keyboard?: Keyboard) =>
  tg('editMessageText', {
    chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: keyboard ?? [] },
  })

/** Los textos que escribe el usuario (descripciones, nombres) pueden traer < o &: se escapan para HTML */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ---------- Datos del usuario ----------

const userRef = (uid: string) => db().collection('users').doc(uid)
const chatRef = (chatId: number) => db().collection('telegramChats').doc(String(chatId))

interface UserData { accounts: Account[]; categories: Category[] }

async function loadBasics(uid: string): Promise<UserData> {
  const u = userRef(uid)
  const [accs, cats] = await Promise.all([u.collection('accounts').get(), u.collection('categories').get()])
  const accounts = accs.docs.map((d) => ({ ...d.data(), id: d.id }) as Account)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const categories = cats.docs.map((d) => ({ ...d.data(), id: d.id }) as Category)
  return { accounts, categories }
}

/** Últimos movimientos registrados (los más nuevos primero) */
async function recentTxs(uid: string, n: number): Promise<Transaction[]> {
  const snap = await userRef(uid).collection('transactions').orderBy('createdAt', 'desc').limit(n).get()
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Transaction)
}

/**
 * Saldo de una cuenta sin descargar todos los movimientos: Firestore suma en el servidor
 * (cada suma cuesta 1 lectura por cada 1.000 movimientos). Misma fórmula que accountBalance().
 */
async function balanceOf(uid: string, a: Account): Promise<number> {
  const col = userRef(uid).collection('transactions')
  const sum = async (q: Query) => (await q.aggregate({ s: AggregateField.sum('amount') }).get()).data().s ?? 0
  const [inc, exp, out, inn] = await Promise.all([
    sum(col.where('accountId', '==', a.id).where('type', '==', 'income')),
    sum(col.where('accountId', '==', a.id).where('type', '==', 'expense')),
    sum(col.where('accountId', '==', a.id).where('type', '==', 'transfer')),
    sum(col.where('toAccountId', '==', a.id).where('type', '==', 'transfer')),
  ])
  return a.initialBalance + inc - exp - out + inn
}

// ---------- Textos ----------

const HELP = [
  '<b>Registra escribiendo como hablas:</b>',
  '• <code>25k almuerzo nequi</code> → gasto',
  '• <code>+1.020.000 salario bancolombia</code> → ingreso',
  '• <code>200k de bancolombia a nequi</code> → transferencia',
  '• <code>50 lucas cine ayer</code> → también entiende "mil", "lucas", "palos", "ayer", "el lunes" o "15/10"',
  '',
  'Antes de guardar te muestro cómo lo entendí y puedes cambiar la cuenta, la categoría o el tipo.',
  '',
  '<b>Comandos</b>',
  '/saldo · saldo de tus cuentas',
  '/mes · resumen del mes (<code>/mes anterior</code> para el pasado)',
  '/ultimos · últimos 5 movimientos',
  '/deshacer · borra lo último que registraste aquí',
  '/app · abrir Monera',
  '/desvincular · desconectar este chat de tu cuenta',
].join('\n')

const NOT_LINKED = [
  '👋 Hola, soy el bot de <b>Monera</b>.',
  '',
  'Para usarme, conecta tu cuenta: en la app ve a <b>Configuración → Telegram</b> y toca <b>Conectar Telegram</b>.',
  'Si te sale un código, envíamelo así: <code>/vincular CÓDIGO</code>',
].join('\n')

function draftText(d: QuickDraft, data: UserData, note?: string): string {
  const acc = (id?: string) => data.accounts.find((a) => a.id === id)?.name
  const cat = data.categories.find((c) => c.id === d.categoryId)?.name
  const lines = [`${TYPE_EMOJI[d.type]} <b>${TYPE_LABEL[d.type]}</b> · <b>${formatCOP(d.amount)}</b>`]
  if (d.type === 'transfer') {
    lines.push(`🏦 ${esc(acc(d.accountId) ?? '¿Desde?')} → ${esc(acc(d.toAccountId) ?? '¿Hacia?')}`)
  } else {
    lines.push(`🏷️ ${cat ? esc(cat) : '<i>Sin categoría</i>'}`)
    lines.push(`🏦 ${esc(acc(d.accountId) ?? '¿Cuenta?')}`)
  }
  lines.push(`📅 ${friendlyDate(d.date)}`)
  if (d.description) lines.push(`📝 ${esc(d.description)}`)
  const missing = draftMissing(d)
  if (missing) lines.push('', `⚠️ ${missing}`)
  if (note) lines.push('', note)
  return lines.join('\n')
}

function draftKeyboard(d: QuickDraft): Keyboard {
  const ready = !draftMissing(d)
  return [
    ready ? [{ text: '✅ Guardar', callback_data: 'ok' }, { text: '❌ Cancelar', callback_data: 'no' }] : [{ text: '❌ Cancelar', callback_data: 'no' }],
    d.type === 'transfer'
      ? [{ text: '🏦 Desde', callback_data: 'acc' }, { text: '🏦 Hacia', callback_data: 'to' }]
      : [{ text: '🏦 Cuenta', callback_data: 'acc' }, { text: '🏷️ Categoría', callback_data: 'cat' }],
    [{ text: `🔀 Cambiar a ${TYPE_LABEL[NEXT_TYPE[d.type]].toLowerCase()}`, callback_data: 'type' }],
  ]
}

/** Botones en filas de 2 (para elegir cuenta o categoría) */
function grid(items: { id: string; name: string }[], prefix: string): Keyboard {
  const rows: Keyboard = []
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2).map((x) => ({ text: x.name, callback_data: `${prefix}:${x.id}` })))
  }
  rows.push([{ text: '⬅️ Volver', callback_data: 'back' }])
  return rows
}

// ---------- Validación (las reglas de Firestore no aplican a este servidor, así que se repiten aquí) ----------

function validate(d: QuickDraft, data: UserData): string | null {
  const active = (id?: string) => data.accounts.some((a) => a.id === id && a.active)
  if (!Number.isInteger(d.amount) || d.amount <= 0 || d.amount >= 1_000_000_000_000) return 'El monto no es válido.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return 'La fecha no es válida.'
  if (!active(d.accountId)) return 'Elige una cuenta activa.'
  if (d.type === 'transfer') {
    if (!active(d.toAccountId) || d.toAccountId === d.accountId) return 'Elige una cuenta destino distinta.'
  } else if (!data.categories.some((c) => c.id === d.categoryId && c.type === d.type)) {
    return 'Elige una categoría.'
  }
  return null
}

// ---------- Vincular ----------

async function link(chatId: number, from: TgUser | undefined, rawCode: string) {
  const code = rawCode.trim().toUpperCase()
  if (!/^[A-Z0-9]{6,20}$/.test(code)) return send(chatId, 'Ese código no es válido. Genera uno nuevo en la app: <b>Configuración → Telegram</b>.')

  const fs = db()
  const codeRef = fs.collection('telegramCodes').doc(code)
  const result = await fs.runTransaction(async (t) => {
    const c = await t.get(codeRef)
    const data = c.data() as { uid: string; expiresAt: number } | undefined
    if (!data || data.expiresAt < Date.now()) return null
    const uRef = userRef(data.uid)
    const [u, chat] = await Promise.all([t.get(uRef), t.get(chatRef(chatId))])

    // Una cuenta = un chat. Si tu cuenta estaba en otro chat, o este chat era de otra cuenta, se sueltan.
    const oldChatId = (u.data()?.telegram as { chatId?: number } | undefined)?.chatId
    if (oldChatId && oldChatId !== chatId) t.delete(chatRef(oldChatId))
    const otherUid = (chat.data() as ChatDoc | undefined)?.uid
    if (otherUid && otherUid !== data.uid) t.set(userRef(otherUid), { telegram: FieldValue.delete() }, { merge: true })

    const now = Date.now()
    t.set(chatRef(chatId), { uid: data.uid, username: from?.username ?? null, firstName: from?.first_name ?? null, linkedAt: now, lastTxIds: [] })
    t.set(uRef, { telegram: { chatId, username: from?.username ?? null, firstName: from?.first_name ?? null, linkedAt: now } }, { merge: true })
    t.delete(codeRef)
    return data.uid
  })

  if (!result) return send(chatId, 'Ese código ya se usó o venció (duran 10 minutos). Genera uno nuevo en la app: <b>Configuración → Telegram</b>.')
  return send(chatId, `✅ ¡Listo${from?.first_name ? `, ${esc(from.first_name)}` : ''}! Tu cuenta de Monera quedó conectada.\n\n${HELP}`)
}

// ---------- Mensajes ----------

async function onMessage(msg: TgMessage) {
  const chatId = msg.chat.id
  const text = (msg.text ?? '').trim()
  if (msg.chat.type !== 'private') {
    // En grupos otras personas verían tus saldos
    return send(chatId, 'Por privacidad solo funciono en chats privados. Escríbeme directamente.')
  }

  const cmdMatch = /^\/(\w+)(?:@\w+)?\s*(.*)$/s.exec(text)
  const cmd = cmdMatch?.[1].toLowerCase()
  const arg = cmdMatch?.[2].trim() ?? ''

  if ((cmd === 'start' || cmd === 'vincular') && arg) return link(chatId, msg.from, arg)

  const snap = await chatRef(chatId).get()
  const chat = snap.data() as ChatDoc | undefined
  if (!chat) return send(chatId, NOT_LINKED)

  switch (cmd) {
    case undefined: return onEntry(chatId, chat, text)
    case 'start':
    case 'ayuda':
    case 'help': return send(chatId, HELP)
    case 'saldo':
    case 'saldos':
    case 'cuentas': return cmdBalance(chatId, chat)
    case 'mes':
    case 'resumen': return cmdMonth(chatId, chat, arg)
    case 'ultimos':
    case 'movimientos': return cmdLast(chatId, chat)
    case 'deshacer': return cmdUndo(chatId, chat)
    case 'cancelar':
      await chatRef(chatId).update({ pending: FieldValue.delete() })
      return send(chatId, 'Listo, no guardé nada.')
    case 'app': return cmdApp(chatId)
    case 'vincular': return send(chatId, 'Envíame el código así: <code>/vincular CÓDIGO</code>')
    case 'desvincular': return cmdUnlink(chatId, chat)
    default: return send(chatId, `No conozco ese comando.\n\n${HELP}`)
  }
}

/** Frase libre: "25k almuerzo nequi" → borrador con botones para confirmar */
async function onEntry(chatId: number, chat: ChatDoc, text: string) {
  const [data, transactions] = await Promise.all([loadBasics(chat.uid), recentTxs(chat.uid, 200)])
  if (!data.accounts.some((a) => a.active)) return send(chatId, 'Primero crea una cuenta en la app (Nequi, efectivo, banco…) y luego vuelve a escribirme.')

  const draft = parseQuickEntry(text, { ...data, transactions, today: todayStr() })
  if (!draft) return send(chatId, 'No encontré el monto. Escríbelo así: <code>25k almuerzo nequi</code>, <code>25 mil</code> o <code>25.000</code>.\n\n/ayuda para ver más ejemplos.')

  const sent = await send(chatId, draftText(draft, data), draftKeyboard(draft))
  if (sent) await chatRef(chatId).update({ pending: { ...stripUndefined(draft), messageId: sent.message_id } })
}

async function cmdBalance(chatId: number, chat: ChatDoc) {
  const { accounts } = await loadBasics(chat.uid)
  const active = accounts.filter((a) => a.active)
  if (!active.length) return send(chatId, 'Aún no tienes cuentas. Créalas en la app.')
  const balances = await Promise.all(active.map((a) => balanceOf(chat.uid, a)))
  const total = balances.reduce((s, b) => s + b, 0)
  const lines = active.map((a, i) => `• ${esc(a.name)}: <b>${formatCOP(balances[i])}</b>`)
  return send(chatId, ['🏦 <b>Tus cuentas</b>', '', ...lines, '', `<b>Total: ${formatCOP(total)}</b>`].join('\n'))
}

async function cmdMonth(chatId: number, chat: ChatDoc, arg: string) {
  const current = monthKey(todayStr())
  const month = /^(anterior|pasado)$/i.test(arg) ? shiftMonth(current, -1) : current
  const snap = await userRef(chat.uid).collection('transactions')
    .where('date', '>=', `${month}-01`).where('date', '<', `${shiftMonth(month, 1)}-01`).get()
  const txs = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Transaction)
  const { income, expense } = monthTotals(txs, month)
  const byCat = Object.entries(expensesByCategory(txs, month)).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const { categories } = byCat.length ? await loadBasics(chat.uid) : { categories: [] as Category[] }

  const lines = [
    `📊 <b>${monthLabel(month).replace(/^./, (c) => c.toUpperCase())}</b>`,
    '',
    `💰 Ingresos: <b>${formatCOP(income)}</b>`,
    `💸 Gastos: <b>${formatCOP(expense)}</b>`,
    `⚖️ Balance: <b>${formatCOP(income - expense)}</b>`,
  ]
  if (byCat.length) {
    lines.push('', '<b>En qué más gastaste</b>')
    byCat.forEach(([id, amount], i) => {
      const name = categories.find((c) => c.id === id)?.name ?? 'Sin categoría'
      lines.push(`${i + 1}. ${esc(name)}: ${formatCOP(amount)} (${Math.round((amount / expense) * 100)}%)`)
    })
  }
  if (!txs.length) lines.push('', 'Aún no hay movimientos este mes.')
  return send(chatId, lines.join('\n'))
}

async function cmdLast(chatId: number, chat: ChatDoc) {
  const [txs, data] = await Promise.all([recentTxs(chat.uid, 5), loadBasics(chat.uid)])
  if (!txs.length) return send(chatId, 'Aún no tienes movimientos.')
  const acc = (id?: string) => esc(data.accounts.find((a) => a.id === id)?.name ?? '?')
  const lines = txs.map((t) => {
    const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''
    const where = t.type === 'transfer' ? `${acc(t.accountId)} → ${acc(t.toAccountId)}` : acc(t.accountId)
    return `${TYPE_EMOJI[t.type]} <b>${sign}${formatCOP(t.amount)}</b> · ${esc(t.description)}\n     ${friendlyDate(t.date)} · ${where}`
  })
  return send(chatId, ['🧾 <b>Últimos movimientos</b>', '', ...lines].join('\n'))
}

async function cmdUndo(chatId: number, chat: ChatDoc) {
  const id = chat.lastTxIds?.at(-1)
  if (!id) return send(chatId, 'No hay nada para deshacer desde aquí.')
  return send(chatId, await deleteTx(chatId, chat, id))
}

/** Borra un movimiento creado desde el bot y devuelve el texto para contarle al usuario */
async function deleteTx(chatId: number, chat: ChatDoc, id: string): Promise<string> {
  await chatRef(chatId).update({ lastTxIds: FieldValue.arrayRemove(id) })
  const ref = userRef(chat.uid).collection('transactions').doc(id)
  const t = (await ref.get()).data() as Transaction | undefined
  if (!t) return 'Ese movimiento ya no existe (quizá lo borraste en la app).'
  await ref.delete()
  return `🗑️ Eliminé: ${TYPE_LABEL[t.type]} de <b>${formatCOP(t.amount)}</b> · ${esc(t.description)}`
}

function cmdApp(chatId: number) {
  if (!APP_URL) return send(chatId, 'Abre Monera desde tu teléfono o computador.')
  return send(chatId, 'Para gráficas, reportes y editar, abre la app:', [[{ text: '📱 Abrir Monera', url: APP_URL }]])
}

async function cmdUnlink(chatId: number, chat: ChatDoc) {
  const batch = db().batch()
  batch.delete(chatRef(chatId))
  batch.set(userRef(chat.uid), { telegram: FieldValue.delete() }, { merge: true })
  await batch.commit()
  return send(chatId, 'Listo, desconecté este chat de tu cuenta. Puedes volver a conectarlo desde la app cuando quieras.')
}

// ---------- Botones ----------

async function onCallback(cb: TgCallback) {
  const msg = cb.message
  const data = cb.data ?? ''
  const answer = (text?: string) => tg('answerCallbackQuery', { callback_query_id: cb.id, ...(text ? { text } : {}) })
  if (!msg) return answer()
  const chatId = msg.chat.id

  const chat = (await chatRef(chatId).get()).data() as ChatDoc | undefined
  if (!chat) return answer('Este chat ya no está conectado a Monera.')

  // "Deshacer" bajo un movimiento ya guardado
  if (data.startsWith('undo:')) {
    const id = data.slice(5)
    if (!chat.lastTxIds?.includes(id)) return answer('Ya no se puede deshacer desde aquí.')
    await answer()
    return edit(chatId, msg.message_id, await deleteTx(chatId, chat, id))
  }

  const pending = chat.pending
  if (!pending || pending.messageId !== msg.message_id) {
    await edit(chatId, msg.message_id, '⌛ Este borrador ya no está vigente. Escríbeme de nuevo el movimiento.')
    return answer()
  }

  const { messageId, ...draft } = pending
  const userData = await loadBasics(chat.uid)
  const show = (d: QuickDraft) => edit(chatId, messageId, draftText(d, userData), draftKeyboard(d))
  const update = async (d: QuickDraft) => {
    await chatRef(chatId).update({ pending: { ...stripUndefined(d), messageId } })
    await show(d)
  }
  const active = userData.accounts.filter((a) => a.active)
  const [action, value] = data.split(':') as [string, string | undefined]

  switch (action) {
    case 'ok': {
      const error = validate(draft, userData)
      if (error) return answer(error)
      const ref = userRef(chat.uid).collection('transactions').doc()
      const tx = {
        type: draft.type, amount: draft.amount, accountId: draft.accountId!, date: draft.date,
        description: draft.description.slice(0, 120),
        ...(draft.type === 'transfer' ? { toAccountId: draft.toAccountId! } : { categoryId: draft.categoryId! }),
        createdAt: Date.now(),
      }
      // Guarda y quita el borrador a la vez: si tocas Guardar dos veces, no se duplica
      const saved = await db().runTransaction(async (t) => {
        const current = (await t.get(chatRef(chatId))).data() as ChatDoc | undefined
        if (current?.pending?.messageId !== messageId) return false
        t.set(ref, tx)
        t.update(chatRef(chatId), { pending: FieldValue.delete(), lastTxIds: [...(current.lastTxIds ?? []), ref.id].slice(-20) })
        return true
      })
      if (!saved) return answer('Ya estaba guardado.')
      await answer('Guardado ✅')
      const account = userData.accounts.find((a) => a.id === tx.accountId)!
      const balance = await balanceOf(chat.uid, account)
      return edit(chatId, messageId,
        draftText(draft, userData, `✅ <b>Guardado</b> · saldo de ${esc(account.name)}: <b>${formatCOP(balance)}</b>`),
        [[{ text: '↩️ Deshacer', callback_data: `undo:${ref.id}` }]])
    }
    case 'no':
      await chatRef(chatId).update({ pending: FieldValue.delete() })
      await edit(chatId, messageId, '❌ Cancelado, no guardé nada.')
      return answer()
    case 'acc':
      await edit(chatId, messageId, draft.type === 'transfer' ? '¿Desde qué cuenta?' : '¿De qué cuenta?', grid(active, 'sa'))
      return answer()
    case 'to':
      await edit(chatId, messageId, '¿A qué cuenta?', grid(active.filter((a) => a.id !== draft.accountId), 'st'))
      return answer()
    case 'cat': {
      const cats = userData.categories.filter((c) => c.type === draft.type).sort((a, b) => a.name.localeCompare(b.name, 'es'))
      await edit(chatId, messageId, '¿Qué categoría?', grid(cats, 'sc'))
      return answer()
    }
    case 'sa': {
      const d = { ...draft, accountId: value }
      if (d.toAccountId === value) d.toAccountId = undefined
      await update(d)
      return answer()
    }
    case 'st':
      await update({ ...draft, toAccountId: value })
      return answer()
    case 'sc':
      await update({ ...draft, categoryId: value })
      return answer()
    case 'type': {
      const type = NEXT_TYPE[draft.type]
      const d: QuickDraft = { ...draft, type, categoryId: undefined, toAccountId: undefined }
      if (type === 'transfer') d.toAccountId = active.find((a) => a.id !== d.accountId)?.id
      else d.categoryId = userData.categories.find((c) => c.type === type && c.id.endsWith('-other'))?.id
      await update(d)
      return answer()
    }
    case 'back':
      await show(draft)
      return answer()
    default:
      return answer()
  }
}

/** Firestore (admin) no acepta campos undefined */
function stripUndefined<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T
}

// ---------- Entrada ----------

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return new Response('Monera bot', { status: 200 })
  // Solo Telegram conoce este secreto (se lo damos al registrar el webhook)
  if (!SECRET || req.headers.get('x-telegram-bot-api-secret-token') !== SECRET) return new Response('forbidden', { status: 403 })

  const update = (await req.json().catch(() => null)) as TgUpdate | null
  const chatId = update?.message?.chat.id ?? update?.callback_query?.message?.chat.id
  try {
    if (update?.message?.text) await onMessage(update.message)
    else if (update?.callback_query) await onCallback(update.callback_query)
  } catch (e) {
    console.error(e)
    if (chatId) await send(chatId, 'Algo salió mal y no pude completar eso. Inténtalo de nuevo en un momento.').catch(() => {})
  }
  // Siempre 200: si respondemos error, Telegram reintenta el mismo mensaje una y otra vez
  return new Response('ok')
}
