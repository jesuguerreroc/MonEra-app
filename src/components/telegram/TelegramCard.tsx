import { useEffect, useState } from 'react'
import { deleteDoc, deleteField, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { Check, Copy, ExternalLink, Send, Unlink } from 'lucide-react'
import { Card, SectionTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { useUI } from '../../context/UIContext'

/** Usuario del bot sin @ (por ejemplo "MoneraAppBot"). Si no está configurado, la tarjeta no aparece. */
const BOT = (import.meta.env.VITE_TELEGRAM_BOT as string | undefined)?.replace(/^@/, '')
const CODE_MINUTES = 10
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin 0/O ni 1/I para que no se confundan

interface Linked { chatId: number; username?: string | null; firstName?: string | null }

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

/** Conectar Monera con el bot de Telegram: genera un código de un solo uso y muestra si ya está conectado. */
export function TelegramCard() {
  const { user } = useAuth()
  const { toast, confirm } = useUI()
  const uid = user?.uid
  const [linked, setLinked] = useState<Linked | null>(null)
  const [code, setCode] = useState<{ value: string; expiresAt: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  // El bot escribe users/{uid}.telegram al vincularse: así la tarjeta cambia sola a "Conectado"
  useEffect(() => {
    if (!uid) return
    return onSnapshot(doc(db, 'users', uid), (s) => {
      const t = (s.data()?.telegram as Linked | undefined) ?? null
      setLinked(t)
      if (t) setCode(null)
    }, () => setLinked(null))
  }, [uid])

  if (!BOT || !uid) return null

  async function generate() {
    if (!navigator.onLine) return toast('Necesitas internet para conectar Telegram.', 'error')
    setBusy(true)
    try {
      // Si por casualidad el código ya existe, las reglas rechazan la escritura: probamos otro
      for (let i = 0; i < 3; i++) {
        const value = newCode()
        const expiresAt = Date.now() + CODE_MINUTES * 60_000
        try {
          await setDoc(doc(db, 'telegramCodes', value), { uid, expiresAt })
          setCode({ value, expiresAt })
          return
        } catch (e) { if (i === 2) throw e }
      }
    } catch {
      toast('No pudimos generar el código. Revisa que las reglas de Firebase estén actualizadas.', 'error')
    } finally { setBusy(false) }
  }

  async function unlink() {
    if (!linked || !uid) return
    if (!(await confirm({ title: 'Desconectar Telegram', message: 'El bot dejará de registrar y mostrar tus datos. Puedes volver a conectarlo cuando quieras.' }))) return
    setBusy(true)
    try {
      await deleteDoc(doc(db, 'telegramChats', String(linked.chatId))).catch(() => {}) // puede que ya no exista
      await updateDoc(doc(db, 'users', uid), { telegram: deleteField() })
      toast('Telegram desconectado')
    } catch { toast('No pudimos desconectarlo. Inténtalo de nuevo.', 'error') }
    finally { setBusy(false) }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* sin permiso para copiar: el código igual está visible */ }
  }

  const who = linked?.username ? `@${linked.username}` : linked?.firstName ?? 'tu Telegram'
  const until = code ? new Date(code.expiresAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : ''

  return (
    <Card>
      <SectionTitle title="Telegram" />
      {linked ? (
        <>
          <p className="text-sm flex items-center gap-2"><span className="size-2 rounded-full bg-success" aria-hidden />Conectado a <b>{who}</b></p>
          <p className="text-xs text-muted mt-2">
            Escríbele al bot <b>@{BOT}</b> cosas como <code className="text-primary-ink">25k almuerzo nequi</code>, o usa /saldo, /mes y /ultimos.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <a href={`https://t.me/${BOT}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 min-h-11 text-[15px] font-semibold bg-lavender text-primary-ink hover:bg-secondary/25">
              <Send size={16} />Abrir el bot
            </a>
            <Button variant="danger" onClick={unlink} loading={busy} className="!min-h-11"><Unlink size={16} />Desconectar</Button>
          </div>
        </>
      ) : code ? (
        <>
          <p className="text-sm">Toca el botón y luego <b>Iniciar</b> en Telegram. Se conectará solo.</p>
          <a href={`https://t.me/${BOT}?start=${code.value}`} target="_blank" rel="noreferrer"
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 min-h-12 text-[15px] font-semibold bg-primary text-white hover:bg-primary-dark">
            <ExternalLink size={18} />Abrir Telegram
          </a>
          <p className="text-xs text-muted mt-3">¿No se abrió? Envíale esto a <b>@{BOT}</b>:</p>
          <button type="button" onClick={() => copy(`/vincular ${code.value}`)}
            className="mt-1 w-full flex items-center justify-between gap-2 rounded-xl border border-line px-3 min-h-11 font-mono text-sm hover:bg-ink/5">
            /vincular {code.value}
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} className="text-muted" />}
          </button>
          <p className="text-xs text-muted mt-2">El código sirve una sola vez y vence a las {until}.</p>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            Registra gastos, ingresos y transferencias escribiéndole a un bot, y consulta tus saldos y el resumen del mes desde Telegram.
          </p>
          <Button full onClick={generate} loading={busy} className="mt-4"><Send size={18} />Conectar Telegram</Button>
        </>
      )}
    </Card>
  )
}
