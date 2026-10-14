import { useState } from 'react'
import { ArrowRight, Trash2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, inputCls } from '../ui/Field'
import { MoneyInput } from '../ui/MoneyInput'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { removeItem, saveItem } from '../../services/db'
import { frequencyLabel, MONTH_OPTIONS, RECURRING_TEMPLATES, WEEKDAY_OPTIONS } from '../../utils/recurring'
import { todayStr } from '../../utils/format'
import { cn } from '../../utils/cn'
import type { Frequency, Recurring, TransactionType } from '../../types'

const TYPES: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }, { value: 'transfer', label: 'Transferencia' },
]
const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'monthly', label: 'Mensual' }, { value: 'biweekly', label: 'Quincenal' }, { value: 'weekly', label: 'Semanal' }, { value: 'yearly', label: 'Anual' },
]

export function RecurringModal({ editing, onClose }: { editing: Recurring | null; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={editing ? 'Editar pago fijo' : 'Nuevo pago fijo'}>
      <RecurringForm editing={editing} onDone={onClose} />
    </Modal>
  )
}

function RecurringForm({ editing, onDone }: { editing: Recurring | null; onDone: () => void }) {
  const { user } = useAuth()
  const { accounts, categories, transactions } = useData()
  const { toast, confirm } = useUI()
  const options = accounts.filter((a) => a.active || a.id === editing?.accountId || a.id === editing?.toAccountId)
  const today = todayStr()

  const [name, setName] = useState(editing?.name ?? '')
  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense')
  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [variable, setVariable] = useState(editing?.variable ?? false)
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '')
  const [accountId, setAccountId] = useState(editing?.accountId ?? options[0]?.id ?? '')
  const [toAccountId, setToAccountId] = useState(editing?.toAccountId ?? '')
  const [frequency, setFrequency] = useState<Frequency>(editing?.frequency ?? 'monthly')
  const [day, setDay] = useState(editing?.day ?? Number(today.slice(8)))
  const [month, setMonth] = useState(editing?.month ?? Number(today.slice(5, 7)))
  const [startDate, setStartDate] = useState(editing?.startDate ?? today)
  const [auto, setAuto] = useState(editing?.auto ?? false)
  const [active, setActive] = useState(editing?.active ?? true)
  const [saving, setSaving] = useState(false)

  const catList = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'))

  function applyTemplate(t: (typeof RECURRING_TEMPLATES)[number]) {
    setName(t.name); setType(t.type); setCategoryId(t.categoryId); setVariable(t.variable)
    if (t.variable) setAuto(false)
  }

  function changeFrequency(f: Frequency) {
    setFrequency(f)
    if (f === 'weekly') setDay(1)
    else if (frequency === 'weekly') setDay(Number(today.slice(8)))
  }

  async function save() {
    if (!user) return
    if (!name.trim()) return toast('Ponle un nombre (por ejemplo: Internet)', 'error')
    if (!variable && amount <= 0) return toast('Escribe el monto o marca "Monto variable"', 'error')
    if (!accountId) return toast('Elige una cuenta', 'error')
    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) return toast('Elige una cuenta destino distinta', 'error')
    if (type !== 'transfer' && !categoryId) return toast('Elige una categoría', 'error')
    setSaving(true)
    try {
      await saveItem(user.uid, 'recurring', {
        ...(editing ? { id: editing.id } : {}),
        name: name.trim().slice(0, 60), type, amount: variable ? 0 : amount, variable,
        ...(type === 'transfer' ? { toAccountId } : { categoryId }), accountId,
        frequency, day: Math.min(31, Math.max(frequency === 'weekly' ? 0 : 1, day)), ...(frequency === 'yearly' ? { month } : {}),
        startDate, auto: auto && !variable, active,
        skipped: editing?.skipped ?? [], createdAt: editing?.createdAt ?? Date.now(),
      })
      toast(editing ? 'Pago fijo actualizado' : 'Pago fijo creado')
      onDone()
    } catch {
      toast('No pudimos guardarlo. Revisa que las reglas de Firebase estén actualizadas.', 'error')
      setSaving(false)
    }
  }

  async function remove() {
    if (!user || !editing) return
    const used = transactions.some((t) => t.recurringId === editing.id)
    const ok = await confirm({ title: 'Eliminar pago fijo', message: used
      ? `¿Eliminar "${editing.name}"? Los movimientos que ya registraste con él se conservan.`
      : `¿Eliminar "${editing.name}"?` })
    if (!ok) return
    try { await removeItem(user.uid, 'recurring', editing.id); toast('Pago fijo eliminado'); onDone() }
    catch { toast('No pudimos eliminarlo.', 'error') }
  }

  return (
    <div className="space-y-4">
      {!editing && (
        <div>
          <p className="text-sm font-medium mb-2">Empieza rápido</p>
          <div className="flex flex-wrap gap-2">
            {RECURRING_TEMPLATES.map((t) => (
              <button key={t.name} type="button" onClick={() => applyTemplate(t)} aria-pressed={name === t.name}
                className={cn('rounded-full border px-3 min-h-9 text-sm font-medium transition-colors',
                  name === t.name ? 'border-primary bg-primary/10 text-primary-ink' : 'border-line text-muted hover:text-ink')}>{t.name}</button>
            ))}
          </div>
        </div>
      )}

      <Field label="Nombre"><input className={inputCls} value={name} maxLength={60} placeholder="Ej: Internet" onChange={(e) => setName(e.target.value)} /></Field>

      <div role="tablist" aria-label="Tipo" className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-ink/[0.05]">
        {TYPES.map((t) => (
          <button key={t.value} role="tab" aria-selected={type === t.value} onClick={() => { setType(t.value); setCategoryId('') }}
            className={cn('min-h-11 rounded-xl text-sm font-semibold transition', type === t.value ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(23,21,31,.12)]' : 'text-muted')}>
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {!variable && <Field label="Monto"><MoneyInput value={amount} onChange={setAmount} /></Field>}
        <label className="mt-2 flex items-center gap-3 min-h-11 cursor-pointer">
          <input type="checkbox" className="size-5 accent-[#6c4cf1]" checked={variable} onChange={(e) => { setVariable(e.target.checked); if (e.target.checked) setAuto(false) }} />
          <span className="text-sm"><b className="font-medium">Monto variable</b> <span className="text-muted">— cambia cada mes (luz, agua, gas). Lo escribes al pagar.</span></span>
        </label>
      </div>

      {type !== 'transfer' && (
        <Field label="Categoría">
          <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Elegir…</option>
            {catList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      )}

      {type === 'transfer' ? (
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Field label="Desde">
            <select className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {options.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <ArrowRight className="mb-3.5 text-muted" size={20} aria-hidden />
          <Field label="Hacia">
            <select className={inputCls} value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">Elegir…</option>
              {options.filter((a) => a.id !== accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        </div>
      ) : (
        <Field label={type === 'income' ? 'Cuenta donde llega' : 'Cuenta con la que pagas'}>
          <select className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {options.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
      )}

      <fieldset>
        <legend className="text-sm font-medium mb-2">¿Cada cuánto?</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FREQUENCIES.map((f) => (
            <button key={f.value} type="button" onClick={() => changeFrequency(f.value)} aria-pressed={frequency === f.value}
              className={cn('min-h-11 rounded-xl border text-sm font-medium transition-colors',
                frequency === f.value ? 'border-primary bg-lavender text-primary-ink' : 'border-line text-muted hover:text-ink')}>{f.label}</button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {frequency === 'monthly' && (
            <Field label="Día del mes"><input className={inputCls} type="number" inputMode="numeric" min={1} max={31} value={day} onChange={(e) => setDay(Number(e.target.value) || 1)} /></Field>
          )}
          {frequency === 'weekly' && (
            <Field label="Día">
              <select className={inputCls} value={day} onChange={(e) => setDay(Number(e.target.value))}>
                {WEEKDAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          )}
          {frequency === 'yearly' && (
            <>
              <Field label="Día"><input className={inputCls} type="number" inputMode="numeric" min={1} max={31} value={day} onChange={(e) => setDay(Number(e.target.value) || 1)} /></Field>
              <Field label="Mes">
                <select className={inputCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {MONTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </>
          )}
          <Field label="Desde"><input className={inputCls} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value || today)} /></Field>
        </div>
        <p className="text-xs text-muted mt-2">{frequencyLabel({ frequency, day, month })}{frequency === 'monthly' && day > 28 ? '. En meses más cortos será el último día.' : '.'} Te empezará a recordar desde la fecha de "Desde".</p>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium mb-2">Cuando llegue el día</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { v: false, t: 'Preguntarme', d: 'Te aparece en Inicio para confirmarlo con un toque.' },
            { v: true, t: 'Registrar automático', d: variable ? 'No disponible con monto variable.' : 'Se registra solo al abrir la app.' },
          ].map((o) => (
            <button key={o.t} type="button" disabled={o.v && variable} onClick={() => setAuto(o.v)} aria-pressed={auto === o.v}
              className={cn('text-left rounded-xl border p-3 transition-colors disabled:opacity-50',
                auto === o.v ? 'border-primary bg-lavender' : 'border-line hover:bg-ink/[0.03]')}>
              <span className="block text-sm font-semibold">{o.t}</span>
              <span className="block text-xs text-muted mt-0.5">{o.d}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {editing && (
        <label className="flex items-center justify-between min-h-12">
          <span className="text-sm font-medium">Activo</span>
          <input type="checkbox" className="size-6 accent-[#6c4cf1]" checked={active} onChange={(e) => setActive(e.target.checked)} />
        </label>
      )}

      <div className="flex gap-3 pt-1">
        {editing && <Button variant="danger" onClick={remove} aria-label="Eliminar pago fijo"><Trash2 size={18} /></Button>}
        <Button full loading={saving} onClick={save}>Guardar</Button>
      </div>
    </div>
  )
}
